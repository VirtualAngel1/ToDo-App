process.env.DD_API_KEY = process.env.DD_API_KEY || '7ced6304e53cb93d211411a9ab30f07c';
process.env.DD_SITE = 'ap2.datadoghq.com';
process.env.DD_SERVICE = 'to-do app';
process.env.DD_ENV = 'production';
process.env.DD_VERSION = '1.0.0';
process.env.DD_TRACE_DEBUG = 'true';

process.env.DD_AGENTLESS = 'true';

import tracer from 'dd-trace';
tracer.init();

console.log('dd-trace initialized (agentless AP2)')
console.log('Datadog config:', {
  apiKey: process.env.DD_API_KEY,
  service: process.env.DD_SERVICE,
  env: process.env.DD_ENV,
  version: process.env.DD_VERSION
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import Task from './models/Task.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(join(__dirname, '../client')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

app.get('/', (req, res) => {
  res.send('ToDo API is running.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/api/tasks', authenticate, async (req, res, next) => {
  try {
    const tasks = await Task.find({ owner: req.user.username });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

app.post(
  '/api/tasks',
  authenticate,
  body('text').isString().trim().notEmpty().withMessage('Task text is required'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const task = new Task({
        text: req.body.text,
        owner: req.user.username
      });
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

app.put(
  '/api/tasks/:id',
  authenticate,
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.username },
        req.body,
        { new: true, runValidators: true }
      );
      if (!task) return res.status(404).json({ error: 'Not found' });
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

app.delete('/api/tasks/:id', authenticate, async (req, res, next) => {
  try {
    const result = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.username
    });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

app.get('/debug-trace', (req, res) => {
  const span = tracer.startSpan('manual.debug.trace');
  span.setTag('custom', 'forced');
  span.finish();
  res.send('Trace sent');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
