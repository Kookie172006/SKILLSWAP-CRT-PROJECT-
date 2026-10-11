
const User = require("../src/models/User");
const Transaction = require("../models/Transaction");

// View a user's actual credit balance
exports.getBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("credits");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      userId,
      balance: user.credits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View transaction history
exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 });

    res.json({ count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
