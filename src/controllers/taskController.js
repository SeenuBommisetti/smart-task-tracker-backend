const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/taskService');

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user.userId, req.query);

  res.status(200).json({
    data: tasks
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user.userId, req.params.taskId);

  res.status(200).json({
    data: task
  });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.userId, req.body);

  res.status(201).json({
    message: 'Task created successfully',
    data: task
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.userId, req.params.taskId, req.body);

  res.status(200).json({
    message: 'Task updated successfully',
    data: task
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.userId, req.params.taskId);
  res.status(204).send();
});

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
};
