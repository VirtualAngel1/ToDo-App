import React, { useState } from 'react'
import axios from 'axios'
import './style.css';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('handleSubmit...', { username, password })
    const loginUrl = '/api/login'
    console.log('Calling login endpoint:', loginUrl)

    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)

    try {
      const res = await axios.post(
        loginUrl,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          withCredentials: true
        }
      )
      console.log('Login success:', res.status)
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
