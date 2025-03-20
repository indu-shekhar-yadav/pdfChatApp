import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Use the configured Axios instance
import PDFUploader from './PDFUploader'; // Import the updated PDFUploader component

const ChatLayout = ({ chats, fetchChats, handleLogout }) => {
  const [selectedChat, setSelectedChat] = useState(null); // Currently selected chat
  const [query, setQuery] = useState(''); // User's query to the AI
  const [messages, setMessages] = useState([]); // Chat messages for the selected chat
  const [error, setError] = useState(''); // Error messages
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const navigate = useNavigate();

  // Fetch messages for the selected chat when it changes
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
      setMessages([]); // Clear messages if no chat is selected
    }
  }, [selectedChat]);

  // Handle creating a new chat
  const handleNewChat = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/chat/new', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchChats(); // Refresh the chat list
      setSelectedChat(res.data); // Select the new chat
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to create a new chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a query to the AI
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
        `/api/chat/${selectedChat._id}/query`,
        { query },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessages([
        ...messages,
        { sender: 'user', content: query },
        { sender: 'ai', content: res.data.response },
      ]);
      setQuery(''); // Clear the input
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

  // Handle deleting a chat
  const handleDeleteChat = async (chatId) => {
    setError('');
    setLoading(true);
    try {
      await api.delete(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchChats(); // Refresh the chat list
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null); // Deselect the deleted chat
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
      setError('Failed to delete the chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle clearing messages in the current chat
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
      setMessages([]); // Clear the messages in the UI
    } catch (err) {
      console.error('Error clearing messages:', err);
      setError('Failed to clear messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="md:w-1/4 w-full bg-gray-200 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Chats</h2>
        <button
          onClick={handleNewChat}
          className="w-full bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'New Chat'}
        </button>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <ul className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="text-gray-500">No chats yet. Create a new one!</p>
          ) : (
            chats.map((chat) => (
              <li
                key={chat._id}
                className={`p-2 border-b cursor-pointer flex justify-between items-center ${
                  selectedChat && selectedChat._id === chat._id ? 'bg-gray-300' : ''
                } hover:bg-gray-300 transition-colors`}
              >
                <div onClick={() => setSelectedChat(chat)} className="flex-1">
                  <span className="font-medium">Chat {chat._id.slice(-5)}</span>
                  <p className="text-sm text-gray-600">
                    {chat.createdAt
                      ? new Date(chat.createdAt).toLocaleDateString()
                      : 'No date'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteChat(chat._id)}
                  className="text-red-500 hover:text-red-700"
                  disabled={loading}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white p-2 rounded mt-4 hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="md:w-3/4 w-full p-4 flex flex-col">
        <h1 className="text-2xl font-semibold mb-4">Chat with PDF</h1>
        {!selectedChat ? (
          <p className="text-gray-500">Select a chat or create a new one to start.</p>
        ) : (
          <>
            {/* PDF Upload Section */}
            <PDFUploader
              token={localStorage.getItem('token')}
              chatId={selectedChat._id}
            />

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-white rounded-lg shadow mb-4">
              {loading ? (
                <p className="text-gray-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500">No messages yet. Upload a PDF and start chatting!</p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <span
                      className={`inline-block p-2 rounded-lg ${
                        msg.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                      } max-w-[80%] md:max-w-[60%]`}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Chat Controls */}
            <div className="flex items-center space-x-2 mb-4">
              <button
                onClick={handleClearMessages}
                className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
                disabled={loading || messages.length === 0}
              >
                {loading ? 'Clearing...' : 'Clear Messages'}
              </button>
            </div>

            {/* Query Input */}
            <form onSubmit={handleSendQuery} className="flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about the PDF..."
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;