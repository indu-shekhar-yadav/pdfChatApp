// frontend/src/components/ChatLayout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PDFUploader from './PDFUploader';
import { FaSpinner } from 'react-icons/fa';

const ChatLayout = ({ chats, fetchChats, handleLogout }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await api.get(`/api/chat/${selectedChat._id}/messages`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setMessages(res.data);
        } catch (err) {
          console.error('Error fetching messages:', err);
          if (err.code === 'ECONNABORTED') {
            setError('The server took too long to respond. Please try again.');
          } else if (err.response) {
            setError(err.response.data.msg || 'Failed to load messages.');
          } else if (err.request) {
            setError('Unable to reach the server. Please check your internet connection.');
          } else {
            setError('An unexpected error occurred. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const handleNewChat = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/chat/new', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchChats();
      setSelectedChat(res.data);
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create a new chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!selectedChat) {
      setError('Please select or create a chat first.');
      return;
    }
    if (!query.trim()) {
      setError('Please enter a query.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post(
        '/api/chat/message',
        { chatId: selectedChat._id, message: query },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessages(res.data.messages);
      setSelectedChat(res.data);
      fetchChats();
      setQuery('');
    } catch (err) {
      console.error('Error sending query:', err);
      if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.');
      } else if (err.response) {
        setError(err.response.data.msg || 'Failed to get a response from the AI.');
      } else if (err.request) {
        setError('Unable to reach the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    setError('');
    setLoading(true);
    try {
      await api.delete(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchChats();
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete the chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearMessages = async () => {
    if (!selectedChat) {
      setError('Please select a chat first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.delete(`/api/chat/${selectedChat._id}/messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages([]);
    } catch (err) {
      console.error('Error clearing messages:', err);
      setError('Failed to clear messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  const renderMessageContent = (content, sender) => {
    const lines = content.split('\n').filter((line) => line.trim() !== '');
    let currentSection = null;
    const sections = [];
    let currentItems = [];

    lines.forEach((line) => {
      if (line.startsWith('Section: ')) {
        if (currentSection) {
          sections.push({ section: currentSection, items: currentItems });
        }
        currentSection = line.replace('Section: ', '');
        currentItems = [];
      } else if (line.startsWith('-')) {
        currentItems.push(line.replace('-', '').trim());
      } else {
        currentItems.push(line.trim());
      }
    });

    if (currentSection) {
      sections.push({ section: currentSection, items: currentItems });
    } else {
      sections.push({ section: null, items: lines });
    }

    return (
      <div className="space-y-2">
        {sections.map((section, index) => (
          <div key={index} className="space-y-1">
            {section.section && (
              <div className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                {section.section}
              </div>
            )}
            {section.items.map((item, i) => (
              <div key={i} className="text-gray-700 text-sm leading-relaxed">
                {item.startsWith('-') ? `• ${item.replace('-', '').trim()}` : item}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 w-1/4 h-screen bg-gray-100 p-4 flex flex-col shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chats</h2>
        <button
          onClick={handleNewChat}
          className="w-full bg-indigo-600 text-white p-2 rounded-lg mb-4 hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'New Chat'}
        </button>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <div className="flex-1 overflow-y-auto">
          <ul>
            {chats.length === 0 ? (
              <p className="text-gray-500 text-sm">No chats yet. Create a new one!</p>
            ) : (
              chats.map((chat) => (
                <li
                  key={chat._id}
                  className={`p-3 border-b flex justify-between items-center cursor-pointer transition-colors ${
                    selectedChat && selectedChat._id === chat._id
                      ? 'bg-indigo-50'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <div onClick={() => setSelectedChat(chat)} className="flex-1">
                    <span className="font-medium text-gray-800">
                      {chat.title || 'Untitled Chat'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {chat.createdAt
                        ? new Date(chat.createdAt).toLocaleDateString()
                        : 'No date'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteChat(chat._id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-4">
          <button
            onClick={onLogout}
            className="w-full bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="ml-0 md:ml-[25%] w-full md:w-3/4 p-6 flex flex-col bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Chat with PDF</h1>
        {!selectedChat ? (
          <p className="text-gray-500 text-sm">
            Select a chat or create a new one to start.
          </p>
        ) : (
          <>
            <PDFUploader
              token={localStorage.getItem('token')}
              chatId={selectedChat._id}
            />
            <div className="flex-1 overflow-y-auto p-4 bg-white rounded-lg shadow-md mb-6 mt-6">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No PDFs uploaded yet. Upload a PDF and start chatting!
                </p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    } animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[60%] p-4 rounded-lg shadow-sm transition-all ${
                        msg.sender === 'user'
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-gray-50 text-gray-800'
                      }`}
                    >
                      {msg.sender === 'ai'
                        ? renderMessageContent(msg.content, msg.sender)
                        : msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center space-x-2 mb-6">
              <button
                onClick={handleClearMessages}
                className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
                disabled={loading || messages.length === 0}
              >
                {loading ? 'Clearing...' : 'Clear Messages'}
              </button>
            </div>
            <form onSubmit={handleSendQuery} className="flex items-center space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about the PDF..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <FaSpinner className="animate-spin text-lg" />
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;