const loginForm       = document.getElementById('login-form')
const taskForm        = document.getElementById('task-form')
const taskInput       = document.getElementById('task-input')
const taskList        = document.getElementById('task-list')
const authSection     = document.getElementById('auth-section')
const taskSection     = document.getElementById('task-section')
const logoutBtn       = document.getElementById('logout-btn')
const pageTitle       = document.getElementById('page-title')
const taskSearch      = document.getElementById('task-search')
const noTasksMessage  = document.getElementById('no-tasks-message')

let authToken   = sessionStorage.getItem('authToken')   || null
let currentUser = sessionStorage.getItem('currentUser') || null

function switchView(hideEl, showEl) {
  const isLogin = showEl === authSection
  pageTitle.textContent = isLogin ? 'Login' : 'Task List'

  hideEl.classList.add('fade-out')
  hideEl.addEventListener('animationend', () => {
    hideEl.classList.add('hidden')
    hideEl.classList.remove('fade-out')

    showEl.classList.remove('hidden')
    showEl.classList.add('fade-in')
    showEl.addEventListener('animationend', () => {
      showEl.classList.remove('fade-in')

      if (!isLogin) {
        loadTasks(true)
        // cascade the real tasks as before
        document.querySelectorAll('#task-list .cascade-item').forEach(item => {
          item.style.animation = 'none'
          void item.offsetWidth
          item.style.animation = 'slideUp 0.4s ease-out forwards'
          item.addEventListener('animationend', () => {
            item.style.animation = ''
            item.classList.remove('cascade-item')
          }, { once: true })
        })
      }
    }, { once: true })
  }, { once: true })
}

document.addEventListener('DOMContentLoaded', () => {
  if (authToken && currentUser) {
    authSection.classList.add('hidden')
    taskSection.classList.remove('hidden')
    pageTitle.textContent = 'Task List'
    loadTasks(true)
  } else {
    authSection.classList.remove('hidden')
    taskSection.classList.add('hidden')
    pageTitle.textContent = 'Login'
  }
})

loginForm.addEventListener('submit', e => {
  e.preventDefault()
  const username = document.getElementById('username').value.trim()
  const password = document.getElementById('password').value.trim()
  const stored  = JSON.parse(localStorage.getItem(`user_${username}`))

  if (stored && stored.password === password) {
    authToken   = generateToken()
    currentUser = username
    sessionStorage.setItem('authToken', authToken)
    sessionStorage.setItem('currentUser', currentUser)
    taskSearch.value = ''
    switchView(authSection, taskSection)

  } else if (!stored) {
    localStorage.setItem(
      `user_${username}`,
      JSON.stringify({ password, tasks: [] })
    )
    authToken   = generateToken()
    currentUser = username
    sessionStorage.setItem('authToken', authToken)
    sessionStorage.setItem('currentUser', currentUser)
    taskSearch.value = ''
    switchView(authSection, taskSection)

  } else {
    alert('Invalid login')
  }
})

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('currentUser')
  authToken   = null
  currentUser = null
  taskSearch.value = ''
  document.getElementById('username').value = ''
  document.getElementById('password').value = ''
  // hide message and clear inline styles
  noTasksMessage.classList.add('hidden')
  noTasksMessage.style.animation = ''
  noTasksMessage.style.opacity   = ''
  noTasksMessage.style.transform = ''
  switchView(taskSection, authSection)
})

function loadTasks(animate = true, newIndex = null) {
  const user = JSON.parse(localStorage.getItem(`user_${currentUser}`))
  renderTasks(user.tasks, animate, newIndex)
}

function renderTasks(tasks, animate = true, newIndex = null) {
  taskList.innerHTML = ''

  if (tasks.length === 0) {
    // show empty state immediately, but delay its slideUp animation
    noTasksMessage.classList.remove('hidden')
    // reset to starting state
    noTasksMessage.style.animation = 'none'
    noTasksMessage.style.opacity   = '0'
    noTasksMessage.style.transform = 'translateY(20px)'
    // flush
    void noTasksMessage.offsetWidth

    // wait for Add-Task slide (0.4s), then animate empty message
    setTimeout(() => {
      noTasksMessage.style.animation = 'slideUp 0.4s ease-out forwards'
      noTasksMessage.addEventListener('animationend', () => {
        noTasksMessage.style.animation = ''
        noTasksMessage.style.transform = ''
        noTasksMessage.style.opacity   = ''
      }, { once: true })
    }, 400)

  } else {
    // hide and clear when there are tasks
    noTasksMessage.classList.add('hidden')
    noTasksMessage.style.animation = ''
    noTasksMessage.style.opacity   = ''
    noTasksMessage.style.transform = ''
  }

  tasks.forEach((task, index) => {
    const li = document.createElement('li')
    li.dataset.id = index
    li.classList.toggle('completed', task.completed)

    if (animate && newIndex === null) {
      li.classList.add('cascade-item')
      void li.offsetWidth
      li.style.animation = 'slideUp 0.4s ease-out forwards'
      li.addEventListener('animationend', () => {
        li.style.animation = ''
        li.classList.remove('cascade-item')
      }, { once: true })
    }

    if (newIndex === index) {
      li.setAttribute('data-new', '')
      li.addEventListener('animationend', () => li.removeAttribute('data-new'), { once: true })
    }

    li.innerHTML = `
      <span class="title">${task.text}</span>
      <span class="actions">
        <button class="toggle-complete" aria-label="Toggle complete">
          ${task.completed ? '↩︎' : '✅'}
        </button>
        <button class="delete-task" aria-label="Delete task">✕</button>
      </span>
    `

    li.querySelector('.toggle-complete').addEventListener('click', () =>
      toggleComplete(index, task.completed)
    )

    li.querySelector('.delete-task').addEventListener('click', () => {
      li.classList.add('slide-out')
      li.addEventListener('animationend', () => {
        deleteTask(index)
      }, { once: true })
    })

    taskList.appendChild(li)
  })

  applySearchFilter()
}

taskForm.addEventListener('submit', e => {
  e.preventDefault()
  const text = taskInput.value.trim()
  if (!text) return

  const user = JSON.parse(localStorage.getItem(`user_${currentUser}`))
  user.tasks.push({ text, completed: false })
  localStorage.setItem(`user_${currentUser}`, JSON.stringify(user))
  taskInput.value = ''

  const newIndex = user.tasks.length - 1
  loadTasks(false, newIndex)
})

function toggleComplete(index, currentState) {
  const user = JSON.parse(localStorage.getItem(`user_${currentUser}`))
  user.tasks[index].completed = !currentState
  localStorage.setItem(`user_${currentUser}`, JSON.stringify(user))
  loadTasks(false)
}

function deleteTask(index) {
  const user = JSON.parse(localStorage.getItem(`user_${currentUser}`))
  user.tasks.splice(index, 1)
  localStorage.setItem(`user_${currentUser}`, JSON.stringify(user))
  loadTasks(false)
}

function generateToken() {
  return Math.random().toString(36).substr(2)
}

function applySearchFilter() {
  const query = taskSearch.value
  taskList.querySelectorAll('li').forEach(item => {
    const text = item.querySelector('.title').textContent
    item.style.display = text.includes(query) ? '' : 'none'
  })
}

taskSearch.addEventListener('input', applySearchFilter)
