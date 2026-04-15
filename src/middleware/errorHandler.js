module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: err.message,
      stack: err.stack
    }));
  }

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    requestId: req.requestId
  });
};
