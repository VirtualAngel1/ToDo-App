const loginForm     = document.getElementById('login-form');
const taskForm      = document.getElementById('task-form');
const taskInput     = document.getElementById('task-input');
const taskList      = document.getElementById('task-list');
const authSection   = document.getElementById('auth-section');
const taskSection   = document.getElementById('task-section');
const logoutBtn     = document.getElementById('logout-btn');

let authToken = sessionStorage.getItem('authToken') || null;

document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showTasksView();
    loadTasks();
  } else {
    showLoginView();
  }
});

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    authToken = data.token;
    sessionStorage.setItem('authToken', authToken);

    showTasksView();
    loadTasks();
  } catch (err) {
    alert(err.message);
    console.error('Login error:', err);
  }
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('authToken');
  authToken = null;
  showLoginView();
});

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');

    renderTasks(data);
  } catch (err) {
    alert(err.message);
    console.error('Load tasks error:', err);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.dataset.id = task._id;
    li.classList.toggle('completed', task.completed);
    li.innerHTML = `
      <span class="title">${task.text}</span>
      <button class="toggle-complete">${task.completed ? '↩︎' : '✅'}</button>
      <button class="delete-task">✕</button>
    `;

    const toggleBtn = li.querySelector('.toggle-complete');
    const deleteBtn = li.querySelector('.delete-task');

    toggleBtn.addEventListener('click', () =>
      toggleComplete(task._id, task.completed)
    );
    deleteBtn.addEventListener('click', () =>
      deleteTask(task._id)
    );

    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', async e => {
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add task');

    taskInput.value = '';
    loadTasks();
  } catch (err) {
    alert(err.message);
    console.error('Add task error:', err);
  }
});

async function toggleComplete(id, currentState) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ completed: !currentState })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task');

    loadTasks();
  } catch (err) {
    alert(err.message);
    console.error('Toggle task error:', err);
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
    }

    if (!res.ok) {
      const errorMsg = data?.error || 'Failed to delete task';
      throw new Error(errorMsg);
    }

    loadTasks();
  } catch (err) {
    alert(err.message);
    console.error('Delete task error:', err);
  }
}

function showTasksView() {
  authSection.style.display = 'none';
  taskSection.style.display = 'block';
}

function showLoginView() {
  authSection.style.display = 'block';
  taskSection.style.display = 'none';
}
