const mongoose = require("mongoose");

const swapSchema = new mongoose.Schema(
  {
    requesterId: { type: String, required: true },
    requesterName: { type: String, required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String, required: true },
    skillOffered: { type: String, required: true, trim: true },
    skillWanted: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Swap", swapSchema);