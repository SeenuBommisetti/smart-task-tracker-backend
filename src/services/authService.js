const bcrypt = require('bcrypt');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.created_at,
  updatedAt: user.updated_at
});

const findUserByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] || null;
};

const signup = async ({ name, email, password }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at, updated_at`,
    [name, email, passwordHash]
  );

  return sanitizeUser(result.rows[0]);
};

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return sanitizeUser(user);
};

const getUserById = async (userId) => {
  const result = await db.query(
    `SELECT id, name, email, created_at, updated_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(result.rows[0]);
};

module.exports = {
  signup,
  login,
  getUserById
};
