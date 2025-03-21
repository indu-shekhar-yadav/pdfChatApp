// frontend/src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const token = res.data.token;
      if (token) {
        localStorage.setItem('token', token);
        setToken(token);
        navigate('/chat');
      } else {
        setError('No token received from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.');
      } else if (err.response) {
        setError(err.response.data.msg || 'An error occurred during login.');
      } else if (err.request) {
        setError('Unable to reach the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text animate-pulse">
          Welcome to Chat with PDF
        </h1>
        <h2 className="text-2xl font-semibold text-primary mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white p-2 rounded hover:bg-indigo-700"
          >
            Login
          </button>
        </form>
        <p className="mt-2 text-center">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;