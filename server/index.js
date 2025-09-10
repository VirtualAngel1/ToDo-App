require('dotenv').config()

const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, '../client')))

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'

let tasks = []
let nextId = 1

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  if (username && password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' })
    return res.json({ token })
  }
  res.status(401).json({ error: 'Invalid credentials' })
})

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

app.get('/api/tasks', authenticate, (req, res) => {
  res.json(tasks)
})

app.post('/api/tasks', authenticate, (req, res) => {
  const { text } = req.body
  const task = { id: nextId++, text, completed: false }
  tasks.push(task)
  res.status(201).json(task)
})

app.put('/api/tasks/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)
  const task = tasks.find(t => t.id === id)
  if (!task) return res.status(404).json({ error: 'Not found' })
  Object.assign(task, req.body)
  res.json(task)
})

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const id = Number(req.params.id)
  tasks = tasks.filter(t => t.id !== id)
  res.status(204).end()
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
