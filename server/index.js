require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const jwt           = require('jsonwebtoken');
const path          = require('path');
const morgan        = require('morgan');
const mongoose      = require('mongoose');
const { body, validationResult } = require('express-validator');
const Task          = require('./models/Task');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '../client')));

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const MONGO_URI  = process.env.MONGO_URI || 'mongodb://localhost:27017/todo-app';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

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
    const tasks = await Task.find();
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
      const task = new Task({ text: req.body.text });
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
      const task = await Task.findByIdAndUpdate(
        req.params.id,
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
    const result = await Task.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
