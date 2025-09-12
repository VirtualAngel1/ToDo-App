import React, { useState, useEffect } from 'react'
import axios from 'axios'

function TaskList({ authToken, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    loadTasks()
  }, [authToken])

  const loadTasks = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setTasks(res.data)
    } catch (err) {
      console.error('Load tasks error:', err.response || err)
      alert('Failed to load tasks')
    }
  }

  const addTask = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks`,
        { text },
        { headers: { Authorization: `Bearer ${authToken}` } }
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
        `${process.env.REACT_APP_API_URL}/api/tasks/${id}`,
        { completed: !completed },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      setTasks(prev =>
        prev.map(t => (t._id === id ? res.data : t))
      )
    } catch (err) {
      console.error('Update task error:', err.response || err)
      alert('Failed to update task')
    }
  }

  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/tasks/${id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
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
            <button onClick={() => deleteTask(task._id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default TaskList
