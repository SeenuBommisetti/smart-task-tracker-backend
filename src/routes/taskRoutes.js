const express = require('express');

const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  taskIdValidator,
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator
} = require('../validators/taskValidators');

const router = express.Router();

router.use(authenticate);

router.get('/', taskQueryValidator, validate, taskController.listTasks);
router.get('/:taskId', taskIdValidator, validate, taskController.getTask);
router.post('/', createTaskValidator, validate, taskController.createTask);
router.put('/:taskId', updateTaskValidator, validate, taskController.updateTask);
router.delete('/:taskId', taskIdValidator, validate, taskController.deleteTask);

module.exports = router;
