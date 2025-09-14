import React from 'react';
import LoginForm from './TaskList'; 
import TaskList from './LoginForm'; 
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
