require('./testEnv');

const app = require('../../src/app');
const db = require('../../src/config/db');

const startTestServer = async () => {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  return {
    baseUrl,
    close: async () => {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      await db.pool.end();
    }
  };
};

module.exports = {
  startTestServer
};
