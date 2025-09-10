jest.setTimeout(50000);

require('dotenv').config();
const request  = require('supertest');
const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const Task     = require('../models/Task');
const app      = require('../index');

const token = jwt.sign(
  { username: 'test' },
  process.env.JWT_SECRET || 'default_secret'
);

beforeAll(async () => {
await mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app-test'
);
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

describe('Task API', () => {
  let taskId;

  it('Should reject access without token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/);
  });

  it('Should create a task with valid input', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Write tests' });
    expect(res.statusCode).toBe(201);
    expect(res.body.text).toBe('Write tests');
    taskId = res.body._id;
  });

  it('Should reject task creation with empty text', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].msg).toBe('Task text is required');
  });

  it('Should fetch all tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('Should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  it('Should return 404 for non-existent task update', async () => {
    const fakeId = '64f000000000000000000000';
    const res = await request(app)
      .put(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('Should delete a task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });

  it('Should return 404 for non-existent task delete', async () => {
    const fakeId = '64f000000000000000000000';
    const res = await request(app)
      .delete(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
