// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback
import { Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatLayout from './components/ChatLayout';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');

  // Wrap fetchChats in useCallback to memoize it
  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.');
      } else if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          setToken('');
        } else {
          setError(err.response.data.msg || 'Failed to load chat history. Please try again.');
        }
      } else if (err.request) {
        setError('Unable to reach the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [token]); // Dependencies of fetchChats

  useEffect(() => {
    fetchChats();
  }, [token, fetchChats]); // fetchChats is now stable

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setChats([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/chat" /> : <Login setToken={setToken} />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/chat" /> : <Signup setToken={setToken} />}
        />
        <Route
          path="/chat"
          element={
            token ? (
              <ChatLayout chats={chats} fetchChats={fetchChats} handleLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to={token ? "/chat" : "/login"} />} />
      </Routes>
      {error && (
        <div className="fixed bottom-4 left-4 bg-red-500 text-white p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default App;