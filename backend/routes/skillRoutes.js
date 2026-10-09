const express = require("express");
const router = express.Router();

const {
  addSkill,
  getSkills,
  deleteSkill,
  getMatches,
} = require("../controllers/skillController");

router.post("/", addSkill);
router.get("/", getSkills);
router.get("/matches/:userId", getMatches);
router.delete("/:id", deleteSkill);

module.exports = router;