const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const { validateTagOwnership } = require('./tagService');

const buildTaskFilters = ({ userId, status, priority, tagId, search }) => {
  const clauses = ['t.user_id = $1'];
  const values = [userId];

  if (status) {
    values.push(status);
    clauses.push(`t.status = $${values.length}`);
  }

  if (priority) {
    values.push(priority);
    clauses.push(`t.priority = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    clauses.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
  }

  if (tagId) {
    values.push(tagId);
    clauses.push(`EXISTS (
      SELECT 1
      FROM task_tags tt
      WHERE tt.task_id = t.id AND tt.tag_id = $${values.length}
    )`);
  }

  return {
    whereClause: clauses.join(' AND '),
    values
  };
};

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  deadline: row.deadline,
  priority: row.priority,
  status: row.status,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  tags: row.tags || []
});

const baseTaskSelect = `
  SELECT
    t.id,
    t.title,
    t.description,
    t.deadline,
    t.priority,
    t.status,
    t.completed_at,
    t.created_at,
    t.updated_at,
    COALESCE(
      JSON_AGG(
        DISTINCT JSONB_BUILD_OBJECT(
          'id', tg.id,
          'name', tg.name,
          'color', tg.color
        )
      ) FILTER (WHERE tg.id IS NOT NULL),
      '[]'::json
    ) AS tags
  FROM tasks t
  LEFT JOIN task_tags tt ON tt.task_id = t.id
  LEFT JOIN tags tg ON tg.id = tt.tag_id
`;

const getTaskById = async (userId, taskId, client = db) => {
  const result = await client.query(
    `${baseTaskSelect}
     WHERE t.user_id = $1 AND t.id = $2
     GROUP BY t.id`,
    [userId, taskId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Task not found');
  }

  return mapTask(result.rows[0]);
};

const syncTaskTags = async (client, taskId, tagIds) => {
  await client.query('DELETE FROM task_tags WHERE task_id = $1', [taskId]);

  if (!tagIds.length) {
    return;
  }

  const insertValues = [];
  const placeholders = [];

  tagIds.forEach((tagId, index) => {
    const base = index * 2;
    placeholders.push(`($${base + 1}, $${base + 2})`);
    insertValues.push(taskId, tagId);
  });

  await client.query(
    `INSERT INTO task_tags (task_id, tag_id)
     VALUES ${placeholders.join(', ')}`,
    insertValues
  );
};

const listTasks = async (userId, filters) => {
  const { whereClause, values } = buildTaskFilters({ userId, ...filters });
  const result = await db.query(
    `${baseTaskSelect}
     WHERE ${whereClause}
     GROUP BY t.id
     ORDER BY
       CASE t.priority
         WHEN 'high' THEN 1
         WHEN 'medium' THEN 2
         ELSE 3
       END,
       t.deadline ASC NULLS LAST,
       t.created_at DESC`,
    values
  );

  return result.rows.map(mapTask);
};

const createTask = async (userId, payload) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const {
      title,
      description = '',
      deadline = null,
      priority = 'medium',
      status = 'pending',
      tagIds = []
    } = payload;

    await validateTagOwnership(userId, tagIds, client);

    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const taskResult = await client.query(
      `INSERT INTO tasks (user_id, title, description, deadline, priority, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [userId, title, description, deadline, priority, status, completedAt]
    );

    const taskId = taskResult.rows[0].id;
    await syncTaskTags(client, taskId, tagIds);
    await client.query('COMMIT');

    return getTaskById(userId, taskId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateTask = async (userId, taskId, payload) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const existingTaskResult = await client.query(
      'SELECT id, status, completed_at FROM tasks WHERE user_id = $1 AND id = $2 LIMIT 1',
      [userId, taskId]
    );

    if (existingTaskResult.rowCount === 0) {
      throw new ApiError(404, 'Task not found');
    }

    const existingTask = existingTaskResult.rows[0];
    const updateFields = [];
    const values = [];
    let position = 1;

    if (payload.title !== undefined) {
      updateFields.push(`title = $${position}`);
      values.push(payload.title);
      position += 1;
    }

    if (payload.description !== undefined) {
      updateFields.push(`description = $${position}`);
      values.push(payload.description);
      position += 1;
    }

    if (payload.deadline !== undefined) {
      updateFields.push(`deadline = $${position}`);
      values.push(payload.deadline);
      position += 1;
    }

    if (payload.priority !== undefined) {
      updateFields.push(`priority = $${position}`);
      values.push(payload.priority);
      position += 1;
    }

    if (payload.status !== undefined) {
      updateFields.push(`status = $${position}`);
      values.push(payload.status);
      position += 1;

      let completedAt = existingTask.completed_at;
      if (payload.status === 'completed' && existingTask.status !== 'completed') {
        completedAt = new Date().toISOString();
      }
      if (payload.status === 'pending') {
        completedAt = null;
      }

      updateFields.push(`completed_at = $${position}`);
      values.push(completedAt);
      position += 1;
    }

    if (updateFields.length > 0) {
      values.push(userId, taskId);
      await client.query(
        `UPDATE tasks
         SET ${updateFields.join(', ')}
         WHERE user_id = $${position} AND id = $${position + 1}`,
        values
      );
    }

    if (payload.tagIds !== undefined) {
      await validateTagOwnership(userId, payload.tagIds, client);
      await syncTaskTags(client, taskId, payload.tagIds);
    }

    await client.query('COMMIT');
    return getTaskById(userId, taskId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteTask = async (userId, taskId) => {
  const result = await db.query(
    'DELETE FROM tasks WHERE user_id = $1 AND id = $2',
    [userId, taskId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Task not found');
  }
};

module.exports = {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
