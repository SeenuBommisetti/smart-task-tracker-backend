const ApiError = require('../utils/ApiError');
const supabase = require('../config/supabase');

const verifyAccessToken = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  return data.user;
};

module.exports = {
  verifyAccessToken
};
