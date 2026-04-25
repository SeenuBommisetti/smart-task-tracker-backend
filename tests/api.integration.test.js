const test = require('node:test');
const assert = require('node:assert/strict');

const { startTestServer } = require('./helpers/testServer');

const createJsonRequest = (baseUrl) => async ({ path, method = 'GET', body, token }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    data
  };
};

test('direct signup is no longer handled by the backend', async () => {
  const { baseUrl, close } = await startTestServer();
  const request = createJsonRequest(baseUrl);

  try {
    const response = await request({
      path: '/auth/signup',
      method: 'POST',
      body: {
        name: 'Integration User',
        email: 'integration@example.com',
        password: 'StrongPass123'
      }
    });

    assert.equal(response.status, 410);
    assert.equal(response.data.message, 'Direct signup and login are handled by Supabase Auth on the client');
  } finally {
    await close();
  }
});

test('direct login is no longer handled by the backend', async () => {
  const { baseUrl, close } = await startTestServer();
  const request = createJsonRequest(baseUrl);

  try {
    const response = await request({
      path: '/auth/login',
      method: 'POST',
      body: {
        email: 'integration@example.com',
        password: 'StrongPass123'
      }
    });

    assert.equal(response.status, 410);
    assert.equal(response.data.message, 'Direct signup and login are handled by Supabase Auth on the client');
  } finally {
    await close();
  }
});

test('protected routes reject missing tokens', async () => {
  const { baseUrl, close } = await startTestServer();
  const request = createJsonRequest(baseUrl);

  try {
    const response = await request({
      path: '/tasks'
    });

    assert.equal(response.status, 401);
    assert.equal(response.data.message, 'Authentication required');
  } finally {
    await close();
  }
});
