const loginForm = document.getElementById('login-form');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const authSection = document.getElementById('auth-section');
const taskSection = document.getElementById('task-section');

let authToken = null;

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    authToken = data.token;

    authSection.hidden = true;
    taskSection.hidden = false;
    loadTasks();
  } catch (err) {
    alert(err.message);
  }
});

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = task.text;
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');

    li.addEventListener('click', () => toggleComplete(task.id, !task.completed));

    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    li.appendChild(delBtn);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ text })
    });

    if (!res.ok) throw new Error('Failed to add task');
    taskInput.value = '';
    loadTasks();
  } catch (err) {
    console.error(err);
  }
});

async function toggleComplete(id, completed) {
  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ completed })
    });
    loadTasks();
  } catch (err) {
    console.error('Failed to update task:', err);
  }
}

async function deleteTask(id) {
  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    loadTasks();
  } catch (err) {
    console.error('Failed to delete task:', err);
  }
}
