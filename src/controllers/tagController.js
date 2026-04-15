const asyncHandler = require('../utils/asyncHandler');
const tagService = require('../services/tagService');

const listTags = asyncHandler(async (req, res) => {
  const tags = await tagService.listTags(req.user.userId);

  res.status(200).json({
    data: tags
  });
});

const createTag = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag(req.user.userId, req.body);

  res.status(201).json({
    message: 'Tag created successfully',
    data: tag
  });
});

const updateTag = asyncHandler(async (req, res) => {
  const payload = {};

  if (req.body.name !== undefined) {
    payload.name = req.body.name;
  }

  if (req.body.color !== undefined) {
    payload.color = req.body.color;
  }

  const tag = await tagService.updateTag(req.user.userId, req.params.tagId, payload);

  res.status(200).json({
    message: 'Tag updated successfully',
    data: tag
  });
});

const deleteTag = asyncHandler(async (req, res) => {
  await tagService.deleteTag(req.user.userId, req.params.tagId);
  res.status(204).send();
});

module.exports = {
  listTags,
  createTag,
  updateTag,
  deleteTag
};
