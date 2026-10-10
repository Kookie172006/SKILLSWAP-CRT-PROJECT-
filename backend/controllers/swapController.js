const Swap = require("../models/Swap");

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

module.exports = { createSwap: exports.createSwap, getSwaps: exports.getSwaps, updateSwapStatus: exports.updateSwapStatus };