import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './api'; // Use the configured Axios instance
import Login from './components/Login';
import Signup from './components/Signup';
import ChatLayout from './components/ChatLayout';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [chats, setChats] = useState([]);
  const [error, setError] = useState('');

  const fetchChats = async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chat history. Please try again.');
    }
  };

  useEffect(() => {
    fetchChats();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setChats([]);
  };

  return (
    <Router>
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
    </Router>
  );
};

export default App;