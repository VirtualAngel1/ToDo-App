import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export default function TaskList({ token, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [text, setText]   = useState('')

  const API_BASE = process.env.REACT_APP_API_URL || ''

  const loadTasks = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/tasks`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTasks(res.data)
    } catch (err) {
      console.error('Load tasks error:', err.response || err)
      alert('Failed to load tasks')
    }
  }, [token, API_BASE])

  useEffect(() => {
    if (token) {
      loadTasks()
    }
  }, [token, loadTasks])

  const addTask = async e => {
    e.preventDefault()
    if (!text.trim()) return

    try {
      const res = await axios.post(
        `${API_BASE}/api/tasks`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTasks(prev => [...prev, res.data])
      setText('')
    } catch (err) {
      console.error('Add task error:', err.response || err)
      alert('Failed to add task')
    }
  }

  const toggleComplete = async (id, completed) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/tasks/${id}`,
        { completed: !completed },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTasks(prev =>
        prev.map(t => (t._id === id ? res.data : t))
      )
    } catch (err) {
      console.error('Update task error:', err.response || err)
      alert('Failed to update task')
    }
  }

  const deleteTask = async id => {
    try {
      await axios.delete(
        `${API_BASE}/api/tasks/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTasks(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      console.error('Delete task error:', err.response || err)
      alert('Failed to delete task')
    }
  }

  return (
    <main className="todo-app" aria-label="Task Management">
      <button
        id="logout-button"
        onClick={() => {
          sessionStorage.removeItem('authToken')
          onLogout()
        }}
      >
        Logout
      </button>

      <form id="task-form" onSubmit={addTask}>
        <input
          id="new-task-input"
          type="text"
          placeholder="Enter a task..."
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />
        <button id="add-task-button" type="submit">
          Add Task
        </button>
      </form>

      <ul id="task-list">
        {tasks.map(task => (
          <li key={task._id} className={task.completed ? 'completed' : ''}>
            <span className="title">{task.text}</span>
            <button
              onClick={() => toggleComplete(task._id, task.completed)}
            >
              {task.completed ? '↩︎' : '✅'}
            </button>
            <button onClick={() => deleteTask(task._id)}>✕</button>
          </li>
        ))}
      </ul>
    </main>
  )
}
