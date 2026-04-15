const ApiError = require('../utils/ApiError');

const parseOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const createCorsOptions = (allowedOrigins) => ({
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests that do not send an Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError(403, 'CORS origin not allowed'));
  }
});

module.exports = {
  parseOrigins,
  createCorsOptions
};
