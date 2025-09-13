import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  sessionStorage.clear();
});

test('renders login form when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});

test('renders task list when authenticated', () => {
  sessionStorage.setItem('authToken', 'fake-token');
  render(<App />);
  expect(screen.getByText(/task/i)).toBeInTheDocument();
});
