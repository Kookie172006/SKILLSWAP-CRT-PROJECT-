const express = require("express");
const router = express.Router();

const {
  getBalance,
  getTransactions,
} = require("../controllers/creditController");

router.get("/:userId/balance", getBalance);
router.get("/:userId/transactions", getTransactions);

module.exports = router;