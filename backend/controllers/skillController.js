const Skill = require("../models/Skill");

// Add a skill
exports.addSkill = async (req, res) => {
  try {
    const { userId, userName, name, type, level, description } = req.body;

    if (!userId || !userName || !name || !type) {
      return res.status(400).json({
        message: "userId, userName, name and type are required",
      });
    }

    if (!["teach", "learn"].includes(type)) {
      return res.status(400).json({
        message: "Type must be teach or learn",
      });
    }

    const skill = await Skill.create({
      userId,
      userName,
      name,
      type,
      level,
      description,
    });

    res.status(201).json({
      message: "Skill added successfully",
      skill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View and search skills
exports.getSkills = async (req, res) => {
  try {
    const { search, type, userId } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (type) {
      if (!["teach", "learn"].includes(type)) {
        return res.status(400).json({
          message: "Type must be teach or learn",
        });
      }
      filter.type = type;
    }

    if (userId) {
      filter.userId = userId;
    }

    const skills = await Skill.find(filter).sort({ createdAt: -1 });

    res.json({ count: skills.length, skills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a skill
exports.deleteSkill = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const skill = await Skill.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!skill) {
      return res.status(404).json({
        message: "Skill not found for this user",
      });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Find people who teach skills a user wants to learn
exports.getMatches = async (req, res) => {
  try {
    const { userId } = req.params;

    const wantedSkills = await Skill.find({
      userId,
      type: "learn",
    });

    const names = wantedSkills.map((skill) => skill.name);

    if (names.length === 0) {
      return res.json({
        message: "Add skills you want to learn first",
        matches: [],
      });
    }

    const matches = await Skill.find({
      userId: { $ne: userId },
      type: "teach",
      name: { $in: names.map((name) => new RegExp(
        `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      )) },
    });

    res.json({ count: matches.length, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};