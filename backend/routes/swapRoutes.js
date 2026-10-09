const express = require("express");
const router = express.Router();

const {
  createSwap,
  getSwaps,
  updateSwapStatus,
} = require("../controllers/swapController");

router.post("/", createSwap);
router.get("/", getSwaps);
router.patch("/:id/status", updateSwapStatus);

module.exports = router;