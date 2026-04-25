const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');

const deprecatedAuthFlow = asyncHandler(async () => {
  throw new ApiError(410, 'Direct signup and login are handled by Supabase Auth on the client');
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
  deprecatedAuthFlow,
  me
};
