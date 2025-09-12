import React, { useState } from 'react'
import axios from 'axios'

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const loginUrl = `${process.env.REACT_APP_API_URL}/api/login`
    console.log('Calling login endpoint:', loginUrl)

    try {
      const res = await axios.post(loginUrl, { username, password })
      onLogin(res.data.token)
    } catch (err) {
      console.error('Login error:', err.response?.data || err)
      alert(err.response?.data?.error || err.message || 'Login failed')
    }
  }

  return (
    <section id="auth-section" aria-label="User Authentication">
      <h1>Login</h1>
      <form id="login-form" onSubmit={handleSubmit}>
        <input
          id="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </section>
  )
}

export default LoginForm
