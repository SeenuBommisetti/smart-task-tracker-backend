const test = require('node:test');
const assert = require('node:assert/strict');

const { startTestServer } = require('./helpers/testServer');
const { cleanupTestUsers } = require('./helpers/testData');

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

test('auth, tasks, tags, and analytics work together', async () => {
  const { baseUrl, close } = await startTestServer();
  const request = createJsonRequest(baseUrl);
  const uniqueId = `itest-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const email = `${uniqueId}@example.com`;

  try {
    await cleanupTestUsers(`${uniqueId}%`);

    const signup = await request({
      path: '/auth/signup',
      method: 'POST',
      body: {
        name: 'Integration User',
        email,
        password: 'StrongPass123'
      }
    });

    assert.equal(signup.status, 201);
    assert.ok(signup.data.data.token);

    const token = signup.data.data.token;

    const me = await request({
      path: '/auth/me',
      token
    });

    assert.equal(me.status, 200);
    assert.equal(me.data.data.user.email, email);

    const tag = await request({
      path: '/tags',
      method: 'POST',
      token,
      body: {
        name: `Focus-${uniqueId}`,
        color: '#0f766e'
      }
    });

    assert.equal(tag.status, 201);
    assert.ok(tag.data.data.id);

    const task = await request({
      path: '/tasks',
      method: 'POST',
      token,
      body: {
        title: 'Integration Task',
        description: 'Verify end-to-end backend behavior',
        priority: 'high',
        status: 'pending',
        tagIds: [tag.data.data.id]
      }
    });

    assert.equal(task.status, 201);
    assert.equal(task.data.data.status, 'pending');
    assert.equal(task.data.data.tags.length, 1);

    const updatedTask = await request({
      path: `/tasks/${task.data.data.id}`,
      method: 'PUT',
      token,
      body: {
        status: 'completed'
      }
    });

    assert.equal(updatedTask.status, 200);
    assert.equal(updatedTask.data.data.status, 'completed');
    assert.ok(updatedTask.data.data.completedAt);

    const tasks = await request({
      path: '/tasks?status=completed',
      token
    });

    assert.equal(tasks.status, 200);
    assert.equal(tasks.data.data.length, 1);

    const analytics = await request({
      path: '/analytics/overview',
      token
    });

    assert.equal(analytics.status, 200);
    assert.equal(analytics.data.data.completion.totalTasks, 1);
    assert.equal(analytics.data.data.completion.completedTasks, 1);
    assert.equal(analytics.data.data.completion.completionRate, 100);
    assert.equal(analytics.data.data.tasksCompletedPerDay.length, 7);
  } finally {
    await cleanupTestUsers(`${uniqueId}%`);
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
