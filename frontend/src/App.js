// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatLayout from './components/ChatLayout';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchChats();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchChats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/chat/history');
      setChats(res.data);
    } catch (err) {
      console.error('Error fetching chats:', err.response?.data || err.message);
    }
  };

  const handleSignout = () => {
    localStorage.removeItem('token');
    setToken('');
    setChats([]);
    setCurrentChat(null);
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          token ? <Navigate to="/chat" /> : <Login setToken={setToken} />
        }
      />
      <Route
        path="/signup"
        element={
          token ? <Navigate to="/chat" /> : <Signup setToken={setToken} />
        }
      />

      {/* Protected Route */}
      <Route
        path="/chat"
        element={
          token ? (
            <ChatLayout
              token={token}
              chats={chats}
              setChats={setChats}
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
              handleSignout={handleSignout}
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Default Route */}
      <Route path="*" element={<Navigate to={token ? '/chat' : '/login'} />} />
    </Routes>
  );
};

export default App;