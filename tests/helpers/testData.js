require('./testEnv');

const db = require('../../src/config/db');

const cleanupTestUsers = async (emailLike) => {
  await db.query('DELETE FROM users WHERE email LIKE $1', [emailLike]);
};

module.exports = {
  cleanupTestUsers
};
