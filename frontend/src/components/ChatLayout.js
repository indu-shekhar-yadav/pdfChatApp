// frontend/src/components/ChatLayout.js
import React from 'react';
import axios from 'axios';
import Chat from './Chat';

const ChatLayout = ({ token, chats, setChats, currentChat, setCurrentChat, handleSignout }) => {
  const handleNewChat = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/chat/new');
      setChats([res.data, ...chats]);
      setCurrentChat(res.data);
    } catch (err) {
      console.error('Error creating chat:', err.response?.data || err.message);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await axios.delete(`http://localhost:5000/api/chat/delete/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(chats.filter(chat => chat._id !== chatId));
      if (currentChat && currentChat._id === chatId) {
        setCurrentChat(null);
      }
    } catch (err) {
      console.error('Error deleting chat:', err.response?.data || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white p-4 flex flex-col h-screen">
        <h1 className="text-2xl font-bold mb-4">Chat with PDF</h1>
        <button
          onClick={handleNewChat}
          className="bg-green-500 text-white px-4 py-2 rounded mb-4 hover:bg-green-600"
        >
          New Chat
        </button>
        <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {chats.length === 0 ? (
            <p>No chat history</p>
          ) : (
            chats.map(chat => (
              <div
                key={chat._id}
                className={`flex items-center justify-between p-2 rounded mb-2 ${currentChat?._id === chat._id ? 'bg-gray-600' : 'hover:bg-gray-700'}`}
              >
                <div
                  onClick={() => setCurrentChat(chat)}
                  className="flex-1 cursor-pointer truncate"
                >
                  {chat.title}
                </div>
                <button
                  onClick={() => handleDeleteChat(chat._id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
        <div className="sticky bottom-0">
          <button
            onClick={handleSignout}
            className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="w-3/4 p-6 flex flex-col overflow-y-auto h-screen">
        <Chat
          token={token}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
          setChats={setChats}
          chats={chats}
        />
      </div>
    </div>
  );
};

export default ChatLayout;