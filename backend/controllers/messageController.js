const Message = require('../models/message');
const Swap = require('../models/Swap');

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { swapId, receiverId, text } = req.body;
    const senderId = req.userId.toString(); // From Auth Middleware

    // Optional: Check if swap is actually accepted before allowing messages
    //const swap = await Swap.findById(swapId);
    //if (!swap || swap.status !== 'accepted') {
     //return res.status(403).json({ success: false, message: 'Swap must be accepted to send messages' });
    //}

    const message = await Message.create({ swapId, senderId, receiverId, text });
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all messages for a specific swap
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ swapId: req.params.swapId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};