const express = require('express');

const authController = require('../controllers/authController');
const env = require('../config/env');
const authenticate = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const authRateLimiter = createRateLimiter({
  windowMs: env.authRateLimitWindowMs,
  maxRequests: env.authRateLimitMaxRequests,
  message: 'Too many authentication attempts. Please try again later.'
});

router.post('/signup', authRateLimiter, authController.deprecatedAuthFlow);
router.post('/login', authRateLimiter, authController.deprecatedAuthFlow);
router.get('/me', authenticate, authController.me);

module.exports = router;
