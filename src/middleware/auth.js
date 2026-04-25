const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');
const { verifyAccessToken } = require('../services/supabaseAuthService');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabaseUser = await verifyAccessToken(token);
    const user = await authService.syncSupabaseUser(supabaseUser);

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired token'));
  }
};

module.exports = authenticate;
