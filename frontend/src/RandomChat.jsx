import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function RandomChat() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, searching, chatting
  const [partner, setPartner] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Connect to socket when component mounts
  useEffect(() => {
    // In production, replace with your actual server URL
    const newSocket = io('https://random-chat-api.onrender.com/');
    setSocket(newSocket);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('waiting', () => {
      setStatus('searching');
    });

    socket.on('connected', (partnerName) => {
      setStatus('chatting');
      setPartner(partnerName);
      setMessages([{ text: `You are now chatting with ${partnerName}`, type: 'system' }]);
    });

    socket.on('message', (msg) => {
      setMessages(prevMessages => [...prevMessages, { text: msg, type: 'received' }]);
    });

    socket.on('chat_ended', () => {
      setMessages(prevMessages => [...prevMessages, { text: 'Your chat partner has disconnected', type: 'system' }]);
      setStatus('idle');
      setPartner('');
    });

    return () => {
      socket.off('waiting');
      socket.off('connected');
      socket.off('message');
      socket.off('chat_ended');
    };
  }, [socket]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const startSearching = () => {
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }
    socket.emit('search', username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && status === 'chatting') {
      socket.emit('message', message);
      setMessages(prevMessages => [...prevMessages, { text: message, type: 'sent' }]);
      setMessage('');
    }
  };

  const endChat = () => {
    socket.emit('end');
    setMessages(prevMessages => [...prevMessages, { text: 'You have ended the chat', type: 'system' }]);
    setStatus('idle');
    setPartner('');
  };

  // Speech bubble SVG paths for chat bubbles
  const SpeechBubbleLeft = () => (
    <svg className="absolute left-0 bottom-0 transform -translate-x-2 translate-y-1" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0C4 0 10 4 10 10H0V0Z" className={darkMode ? "fill-indigo-900" : "fill-blue-50"} />
    </svg>
  );

  const SpeechBubbleRight = () => (
    <svg className="absolute right-0 bottom-0 transform translate-x-2 translate-y-1" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C6 0 0 4 0 10H10V0Z" className={darkMode ? "fill-purple-900" : "fill-pink-100"} />
    </svg>
  );

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed z-50 bottom-6 right-6 p-3 rounded-full shadow-lg transition-all transform hover:scale-110 focus:outline-none"
        style={{
          background: darkMode 
            ? 'linear-gradient(145deg, #ffd060, #ff9c40)' 
            : 'linear-gradient(145deg, #3b82f6, #6366f1)'
        }}
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="flex flex-col max-w-lg mx-auto my-8 w-full h-screen sm:h-auto sm:max-h-[700px] rounded-2xl overflow-hidden shadow-2xl border border-opacity-20 transition-all duration-300"
        style={{
          borderColor: darkMode ? '#6366f1' : '#3b82f6',
          background: darkMode ? '#111827' : 'white',
          boxShadow: darkMode 
            ? '0 25px 50px -12px rgba(99, 102, 241, 0.25)' 
            : '0 25px 50px -12px rgba(59, 130, 246, 0.25)'
        }}
      >
        {/* Header */}
        <div className={`px-6 py-4 transition-colors duration-300`}
          style={{
            background: darkMode 
              ? 'linear-gradient(145deg, #4f46e5, #6366f1)' 
              : 'linear-gradient(145deg, #3b82f6, #60a5fa)'
          }}
        >
          <h1 className="text-3xl font-bold text-white text-center">RandomChat</h1>
          {status === 'chatting' && (
            <div className="text-sm text-white text-center mt-1 flex items-center justify-center">
              <div className="h-3 w-3 bg-green-400 border border-white rounded-full mr-2 animate-pulse"></div>
              Chatting with {partner}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center space-y-6 h-full">
              <div className="text-center space-y-2 max-w-xs">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-blue-600'}`}>Welcome to RandomChat!</h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Meet new friends from around the world!</p>
              </div>
              
              <div className="w-full max-w-xs space-y-4 mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="What's your name?"
                    className={`w-full px-4 py-3 rounded-full focus:outline-none focus:ring-2 ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-indigo-500 placeholder-gray-400' 
                        : 'bg-white text-gray-800 border-blue-300 focus:ring-blue-500 placeholder-gray-500'
                    } border-2 shadow-sm transition-colors duration-300`}
                  />
                </div>
                
                <button 
                  onClick={startSearching}
                  className={`w-full py-3 px-4 rounded-full font-bold shadow-md transform transition-all hover:scale-105 focus:outline-none text-white ${
                    darkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-500' 
                      : 'bg-blue-500 hover:bg-blue-600 border-2 border-blue-400'
                  }`}
                >
                  Let's Chat! 😊
                </button>
              </div>
            </div>
          )}

          {status === 'searching' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-16 h-16 mb-6">
                <div className={`absolute inset-0 border-4 rounded-full animate-spin ${
                  darkMode ? 'border-gray-700 border-t-indigo-500' : 'border-blue-200 border-t-blue-500'
                }`}></div>
                <div className={`absolute inset-2 border-4 rounded-full animate-spin animate-reverse ${
                  darkMode ? 'border-gray-700 border-b-purple-500' : 'border-blue-100 border-b-blue-400'
                }`}></div>
              </div>
              <p className={`font-bold text-xl mb-4 ${darkMode ? 'text-indigo-400' : 'text-blue-500'}`}>Finding someone fun to chat with...</p>
              <button 
                onClick={endChat}
                className={`px-6 py-2 rounded-full transition-colors focus:outline-none shadow-sm ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600' 
                    : 'bg-blue-100 text-blue-600 border-2 border-blue-200 hover:bg-blue-200'
                }`}
              >
                Cancel
              </button>
            </div>
          )}

          {status === 'chatting' && (
            <div className="flex flex-col h-full">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto mb-4 px-4 py-3">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.type === 'sent' ? 'justify-end' : msg.type === 'received' ? 'justify-start' : 'justify-center'}`}
                    >
                      {msg.type === 'system' ? (
                        <div className={`px-4 py-2 rounded-full text-sm max-w-xs text-center border ${
                          darkMode 
                            ? 'bg-gray-700 text-gray-300 border-gray-600' 
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {msg.text}
                        </div>
                      ) : (
                        <div 
                          className={`relative px-4 py-2 rounded-2xl max-w-xs break-words ${
                            msg.type === 'sent' 
                              ? darkMode
                                ? 'bg-purple-900 text-purple-100 mr-1 border-2 border-purple-800' 
                                : 'bg-pink-100 text-pink-800 mr-1 border-2 border-pink-200'
                              : darkMode
                                ? 'bg-indigo-900 text-indigo-100 ml-1 border-2 border-indigo-800'
                                : 'bg-blue-50 text-blue-800 ml-1 border-2 border-blue-100'
                          }`}
                        >
                          {msg.text}
                          {msg.type === 'sent' ? <SpeechBubbleRight /> : <SpeechBubbleLeft />}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className={`rounded-2xl p-3 border-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-blue-200'
              }`}>
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className={`flex-1 p-3 border-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-800 text-gray-100 border-gray-600 focus:ring-indigo-500 placeholder-gray-400' 
                        : 'bg-blue-50 text-gray-800 border-blue-200 focus:ring-blue-400 placeholder-gray-500'
                    }`}
                  />
                  <button 
                    type="submit"
                    className={`p-3 rounded-full focus:outline-none border-2 transform transition-transform hover:scale-105 text-white ${
                      darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-500' 
                        : 'bg-blue-500 hover:bg-blue-600 border-blue-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>

              {/* End Chat Button */}
              <div className="mt-3">
                <button 
                  onClick={endChat}
                  className={`w-full px-4 py-2 rounded-full transition-colors focus:outline-none border-2 font-bold ${
                    darkMode 
                      ? 'bg-red-900 text-red-100 border-red-800 hover:bg-red-800' 
                      : 'bg-red-100 text-red-500 border-red-200 hover:bg-red-200'
                  }`}
                >
                  End Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}