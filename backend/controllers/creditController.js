const Transaction = require("../models/Transaction");

// View a user's credit balance
exports.getBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: null, balance: { $sum: "$amount" } } },
    ]);

    res.json({
      userId,
      balance: result.length ? result[0].balance : 0,
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