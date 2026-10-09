const User = require('../models/User');

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.passwordHash;
  return userObj;
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id || req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const updates = { ...req.body };

    const protectedFields = ['credits', 'role', 'email', 'passwordHash', 'isEmailVerified'];
    const forbiddenKeys = Object.keys(updates).filter((key) => protectedFields.includes(key));

    if (forbiddenKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Protected fields cannot be updated: ${forbiddenKeys.join(', ')}`,
      });
    }

    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getUserProfile, updateUserProfile };
