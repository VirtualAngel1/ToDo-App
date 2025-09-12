import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TaskList({ authToken, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTasks(res.data);
    } catch (err) {
      alert('Failed to load tasks');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/tasks`, { text }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setText('');
      loadTasks();
    } catch (err) {
      alert('Failed to add task');
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/tasks/${id}`, { completed: !completed }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      loadTasks();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      loadTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <section id="task-section" aria-label="Task Management">
      <button onClick={onLogout}>Logout</button>
      <form onSubmit={addTask}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Enter a task..." required />
        <button type="submit">Add Task</button>
      </form>
      <ul>
        {tasks.map(task => (
          <li key={task._id} className={task.completed ? 'completed' : ''}>
            <span className="title">{task.text}</span>
            <button onClick={() => toggleComplete(task._id, task.completed)}>
              {task.completed ? '↩︎' : '✅'}
            </button>
            <button onClick={() => deleteTask(task._id)}>✕</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskList;
