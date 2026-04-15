const express = require('express');

const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/overview', analyticsController.getInsights);

module.exports = router;
