const ApiError = require('../utils/ApiError');

const createRateLimiter = ({
  windowMs,
  maxRequests,
  message
}) => {
  const store = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.route?.path || req.path}`;
    const currentEntry = store.get(key);

    if (!currentEntry || currentEntry.expiresAt <= now) {
      store.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      return next();
    }

    currentEntry.count += 1;

    if (currentEntry.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((currentEntry.expiresAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      return next(new ApiError(429, message));
    }

    return next();
  };
};

module.exports = {
  createRateLimiter
};
