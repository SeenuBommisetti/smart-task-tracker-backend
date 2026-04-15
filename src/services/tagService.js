const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const normalizeTag = (tag) => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
  createdAt: tag.created_at,
  updatedAt: tag.updated_at
});

const listTags = async (userId) => {
  const result = await db.query(
    `SELECT id, name, color, created_at, updated_at
     FROM tags
     WHERE user_id = $1
     ORDER BY name ASC`,
    [userId]
  );

  return result.rows.map(normalizeTag);
};

const createTag = async (userId, { name, color = '#2563eb' }) => {
  try {
    const result = await db.query(
      `INSERT INTO tags (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING id, name, color, created_at, updated_at`,
      [userId, name, color]
    );

    return normalizeTag(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Tag name already exists for this user');
    }

    throw error;
  }
};

const getTagById = async (userId, tagId) => {
  const result = await db.query(
    `SELECT id, name, color, created_at, updated_at
     FROM tags
     WHERE user_id = $1 AND id = $2
     LIMIT 1`,
    [userId, tagId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Tag not found');
  }

  return normalizeTag(result.rows[0]);
};

const updateTag = async (userId, tagId, payload) => {
  const fields = [];
  const values = [];
  let position = 1;

  Object.entries(payload).forEach(([key, value]) => {
    fields.push(`${key} = $${position}`);
    values.push(value);
    position += 1;
  });

  if (fields.length === 0) {
    return getTagById(userId, tagId);
  }

  values.push(userId, tagId);

  try {
    const result = await db.query(
      `UPDATE tags
       SET ${fields.join(', ')}
       WHERE user_id = $${position} AND id = $${position + 1}
       RETURNING id, name, color, created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, 'Tag not found');
    }

    return normalizeTag(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Tag name already exists for this user');
    }

    throw error;
  }
};

const deleteTag = async (userId, tagId) => {
  const result = await db.query(
    'DELETE FROM tags WHERE user_id = $1 AND id = $2',
    [userId, tagId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Tag not found');
  }
};

const validateTagOwnership = async (userId, tagIds = [], client = db) => {
  if (!tagIds.length) {
    return;
  }

  const result = await client.query(
    `SELECT id
     FROM tags
     WHERE user_id = $1 AND id = ANY($2::uuid[])`,
    [userId, tagIds]
  );

  if (result.rowCount !== tagIds.length) {
    throw new ApiError(400, 'One or more tags do not belong to the current user');
  }
};

module.exports = {
  listTags,
  createTag,
  getTagById,
  updateTag,
  deleteTag,
  validateTagOwnership
};
