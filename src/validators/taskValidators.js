const { body, param, query } = require('express-validator');

const priorityValues = ['low', 'medium', 'high'];
const statusValues = ['pending', 'completed'];

const taskIdValidator = [
  param('taskId')
    .isUUID()
    .withMessage('Task id must be a valid UUID')
];

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO 8601 date'),
  body('priority')
    .optional()
    .isIn(priorityValues)
    .withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage('Status must be pending or completed'),
  body('tagIds')
    .optional()
    .isArray()
    .withMessage('tagIds must be an array'),
  body('tagIds.*')
    .optional()
    .isUUID()
    .withMessage('Each tag id must be a valid UUID')
];

const updateTaskValidator = [
  ...taskIdValidator,
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters'),
  body('deadline')
    .optional({ nullable: true })
    .custom((value) => value === null || !Number.isNaN(Date.parse(value)))
    .withMessage('Deadline must be a valid date or null'),
  body('priority')
    .optional()
    .isIn(priorityValues)
    .withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(statusValues)
    .withMessage('Status must be pending or completed'),
  body('tagIds')
    .optional()
    .isArray()
    .withMessage('tagIds must be an array'),
  body('tagIds.*')
    .optional()
    .isUUID()
    .withMessage('Each tag id must be a valid UUID')
];

const taskQueryValidator = [
  query('status')
    .optional()
    .isIn(statusValues)
    .withMessage('Status filter must be pending or completed'),
  query('priority')
    .optional()
    .isIn(priorityValues)
    .withMessage('Priority filter must be low, medium, or high'),
  query('tagId')
    .optional()
    .isUUID()
    .withMessage('Tag filter must be a valid UUID'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search filter must be at most 255 characters')
];

module.exports = {
  taskIdValidator,
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator
};
