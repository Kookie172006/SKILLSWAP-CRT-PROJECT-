const mongoose = require("mongoose");
const Swap = require("../models/Swap");
const User = require("../src/models/User");
const Transaction = require("../models/Transaction");

// Create a swap request
exports.createSwap = async (req, res) => {
  try {
    const {
      requesterId,
      requesterName,
      receiverId,
      receiverName,
      skillOffered,
      skillWanted,
    } = req.body;

    if (
      !requesterId ||
      !requesterName ||
      !receiverId ||
      !receiverName ||
      !skillOffered ||
      !skillWanted
    ) {
      return res.status(400).json({
        message: "Please provide all swap details",
      });
    }

    if (requesterId === receiverId) {
      return res.status(400).json({
        message: "You cannot request a swap with yourself",
      });
    }

    const swap = await Swap.create({
      requesterId,
      requesterName,
      receiverId,
      receiverName,
      skillOffered,
      skillWanted,
    });

    res.status(201).json({
      message: "Swap request created",
      swap,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View requests involving a user
exports.getSwaps = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const swaps = await Swap.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    res.json({ count: swaps.length, swaps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept or reject a request
exports.updateSwapStatus = async (req, res) => {
  try {
    const { status, userId } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be accepted or rejected",
      });
    }

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const swap = await Swap.findOne({
      _id: req.params.id,
      receiverId: userId,
      status: "pending",
    });

    if (!swap) {
      return res.status(404).json({
        message: "Pending request not found for this receiver",
      });
    }

    swap.status = status;
    await swap.save();

    res.json({
      message: `Swap request ${status}`,
      swap,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.completeSwap = async (req, res) => {
  const { userId, lessonRole } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "userId is required",
    });
  }

  if (!["requester", "receiver"].includes(lessonRole)) {
    return res.status(400).json({
      message: "lessonRole must be requester or receiver",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "A valid user ID is required",
    });
  }

  const session = await mongoose.startSession();

  try {
    let completedSwap;

    await session.withTransaction(async () => {
      const swap = await Swap.findById(req.params.id).session(session);

      if (!swap) {
        const error = new Error("Swap not found");
        error.statusCode = 404;
        throw error;
      }

      if (swap.status !== "accepted") {
        const error = new Error(
          "Only accepted swaps can have lessons completed"
        );
        error.statusCode = 400;
        throw error;
      }

      // Identify the teacher, learner and lesson status.
      const teacherId =
        lessonRole === "requester"
          ? swap.requesterId
          : swap.receiverId;

      const learnerId =
        lessonRole === "requester"
          ? swap.receiverId
          : swap.requesterId;

      const statusField =
        lessonRole === "requester"
          ? "requesterLessonStatus"
          : "receiverLessonStatus";

      // Only the teacher of this lesson can mark it completed.
      if (String(teacherId) !== String(userId)) {
        const error = new Error(
          "Only the teacher of this lesson can complete it"
        );
        error.statusCode = 403;
        throw error;
      }

      // Prevent duplicate credit transfers.
      if (swap[statusField] === "completed") {
        const error = new Error(
          "This lesson is already completed"
        );
        error.statusCode = 409;
        throw error;
      }

      if (
        !mongoose.Types.ObjectId.isValid(learnerId) ||
        !mongoose.Types.ObjectId.isValid(teacherId)
      ) {
        const error = new Error(
          "Swap participants must have valid registered user IDs"
        );
        error.statusCode = 400;
        throw error;
      }

      const learner = await User.findById(learnerId).session(session);
      const teacher = await User.findById(teacherId).session(session);

      if (!learner || !teacher) {
        const error = new Error(
          "Both participants must have registered user accounts"
        );
        error.statusCode = 404;
        throw error;
      }

      if (learner.credits < 1) {
        const error = new Error(
          "The learner does not have enough credits"
        );
        error.statusCode = 400;
        throw error;
      }

      // Deduct one credit only if the balance is still sufficient.
      const deduction = await User.updateOne(
        { _id: learner._id, credits: { $gte: 1 } },
        { $inc: { credits: -1 } },
        { session }
      );

      if (deduction.modifiedCount !== 1) {
        const error = new Error(
          "Unable to deduct credit. Please try again"
        );
        error.statusCode = 400;
        throw error;
      }

      // Reward the teacher.
      await User.updateOne(
        { _id: teacher._id },
        { $inc: { credits: 1 } },
        { session }
      );

      // Record both sides of the transfer.
      await Transaction.create(
        [
          {
            userId: String(learner._id),
            amount: -1,
            type: "learning_cost",
            description: `Learned ${lessonRole === "requester" ? swap.skillWanted : swap.skillOffered}`,
            swapId: String(swap._id),
            lessonRole,
          },
          {
            userId: String(teacher._id),
            amount: 1,
            type: "teaching_reward",
            description: `Taught ${lessonRole === "requester" ? swap.skillOffered : swap.skillWanted}`,
            swapId: String(swap._id),
            lessonRole,
          },
        ],
        { session, ordered: true }
      );

      // Mark this lesson completed.
      swap[statusField] = "completed";

      // The whole swap completes only when both lessons are done.
      if (
        swap.requesterLessonStatus === "completed" &&
        swap.receiverLessonStatus === "completed"
      ) {
        swap.status = "completed";
      }

      await swap.save({ session });

      completedSwap = swap;
    });

    return res.json({
      message: "Lesson completed and credits transferred successfully",
      swap: completedSwap,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.code === 11000
        ? "A credit transfer for this lesson already exists"
        : error.message,
    });
  } finally {
    await session.endSession();
  }
};


module.exports = {
  createSwap: exports.createSwap,
  getSwaps: exports.getSwaps,
  updateSwapStatus: exports.updateSwapStatus,
  completeSwap: exports.completeSwap,
};