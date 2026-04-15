const asyncHandler = require('../utils/asyncHandler');
const { generateToken } = require('../utils/jwt');
const authService = require('../services/authService');

const signup = asyncHandler(async (req, res) => {
  const user = await authService.signup(req.body);
  const token = generateToken({ userId: user.id, email: user.email, name: user.name });

  res.status(201).json({
    message: 'Signup successful',
    data: {
      user,
      token
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = generateToken({ userId: user.id, email: user.email, name: user.name });

  res.status(200).json({
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.userId);

  res.status(200).json({
    data: {
      user
    }
  });
});

module.exports = {
  signup,
  login,
  me
};
