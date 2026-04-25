const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.created_at,
  updatedAt: user.updated_at
});

const findUserById = async (userId) => {
  const result = await db.query(
    `SELECT id, name, email, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

const deriveDisplayName = (supabaseUser) => {
  const metadata = supabaseUser.user_metadata || {};
  const candidates = [
    metadata.name,
    metadata.full_name,
    metadata.display_name,
    supabaseUser.email && supabaseUser.email.split('@')[0]
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || 'User';
};

const syncSupabaseUser = async (supabaseUser) => {
  if (!supabaseUser?.id || !supabaseUser.email) {
    throw new ApiError(401, 'Authenticated user details are incomplete');
  }

  const existingUser = await findUserById(supabaseUser.id);

  if (!existingUser) {
    const result = await db.query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, NULL)
       RETURNING id, name, email, created_at, updated_at`,
      [supabaseUser.id, deriveDisplayName(supabaseUser), supabaseUser.email]
    );

    return sanitizeUser(result.rows[0]);
  }

  if (existingUser.email !== supabaseUser.email) {
    const result = await db.query(
      `UPDATE users
       SET email = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, created_at, updated_at`,
      [supabaseUser.id, supabaseUser.email]
    );

    return sanitizeUser(result.rows[0]);
  }

  return sanitizeUser(existingUser);
};

const getUserById = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
};

module.exports = {
  syncSupabaseUser,
  getUserById
};
