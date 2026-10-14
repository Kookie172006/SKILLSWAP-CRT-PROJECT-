const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  swapId: { type: String, required: true },
  requesterId: { type: String, required: true },
  receiverId: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  skillName: { type: String },
  partnerName: { type: String },
  notes: { type: String },
  status: { type: String, default: 'scheduled', enum: ['scheduled', 'completed', 'cancelled'] }
}, { timestamps: true });

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);
