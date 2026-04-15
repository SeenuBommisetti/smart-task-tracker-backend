const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');

const getInsights = asyncHandler(async (req, res) => {
  const insights = await analyticsService.getDashboardInsights(req.user.userId);

  res.status(200).json({
    data: insights
  });
});

module.exports = {
  getInsights
};
