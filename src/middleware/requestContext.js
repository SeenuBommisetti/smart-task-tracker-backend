const crypto = require('crypto');

module.exports = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.set('X-Request-Id', req.requestId);
  next();
};
