const { body, param } = require('express-validator');

const tagIdValidator = [
  param('tagId')
    .isUUID()
    .withMessage('Tag id must be a valid UUID')
];

const createTagValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ max: 60 })
    .withMessage('Tag name must be at most 60 characters'),
  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage('Color must be a valid hex value')
];

const updateTagValidator = [
  ...tagIdValidator,
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tag name cannot be empty')
    .isLength({ max: 60 })
    .withMessage('Tag name must be at most 60 characters'),
  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .withMessage('Color must be a valid hex value')
];

module.exports = {
  tagIdValidator,
  createTagValidator,
  updateTagValidator
};
