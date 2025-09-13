import React, { useState } from 'react';
import LoginForm from './LoginForm';
import TaskList from './TaskList';
import './style.css'; 

function App() {
  const [authToken, setAuthToken] = useState(sessionStorage.getItem('authToken') || null);

  const handleLogin = (token) => {
    sessionStorage.setItem('authToken', token);
    setAuthToken(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setAuthToken(null);
  };

  return (
    <main className="todo-app" role="application" aria-label="To-Do List Application">
      {authToken ? (
        <TaskList authToken={authToken} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </main>
  );
}

export default App;
