import React from 'react';
import LoginForm from './LoginForm';
import TaskList from './TaskList';
function App() {
  const isAuthenticated = !!sessionStorage.getItem('authToken');

  return (
    <div>
      {isAuthenticated ? (
        <TaskList />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

export default App;
