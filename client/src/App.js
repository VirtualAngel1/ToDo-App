import React, { useState, useEffect } from 'react'
import LoginForm from './LoginForm'
import TaskList  from './TaskList'

function App() {
  const [token, setToken] = useState(
    sessionStorage.getItem('authToken')
  )

  useEffect(() => {
    if (token) sessionStorage.setItem('authToken', token)
    else       sessionStorage.removeItem('authToken')
  }, [token])

  const handleLogin = newToken => {
    setToken(newToken)
  }

  const handleLogout = () => {
    setToken(null)
  }

  return (
    <div>
      {token
        ? <TaskList token={token} onLogout={handleLogout} />
        : <LoginForm onLogin={handleLogin} />
      }
    </div>
  )
}

export default App
