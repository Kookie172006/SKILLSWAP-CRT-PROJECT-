const Session = require('../models/session');

exports.scheduleSession = async (req, res) => {
  try {
    const { swapId, receiverId, date, time } = req.body;
    const requesterId = req.userId.toString();

    const session = await Session.create({ swapId, requesterId, receiverId, date, time });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id, 
      { status: 'completed' }, 
      { new: true }
    );
    // Note: Member 3's credit logic can be triggered here later, or done via a separate route!
    res.status(200).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};