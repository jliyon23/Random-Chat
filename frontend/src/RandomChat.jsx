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

  useEffect(() => {
    const newSocket = io('https://random-chat-api.onrender.com/');
    setSocket(newSocket);

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }

    return () => {
      newSocket.disconnect();
    };
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed z-50 bottom-6 right-6 p-3 rounded-md shadow-md transition-all focus:outline-none"
        style={{
          background: darkMode ? 'white' : 'black',
          color: darkMode ? 'black' : 'white'
        }}
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className={`flex flex-col mx-auto my-8 w-full max-w-md h-[600px] sm:h-auto rounded-md overflow-hidden border ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {/* Header */}
        <div className={`px-6 py-4 ${darkMode ? 'bg-black text-white border-b border-gray-800' : 'bg-white text-black border-b border-gray-200'}`}>
          <h1 className="text-2xl font-bold">RandomChat</h1>
          {status === 'chatting' && (
            <div className="text-sm mt-1 flex items-center">
              <div className={`h-2 w-2 ${darkMode ? 'bg-white' : 'bg-black'} rounded-full mr-2 animate-pulse`}></div>
              Chatting with {partner}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col p-4 overflow-hidden ${darkMode ? 'bg-black' : 'bg-white'}`}>
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center space-y-6 h-full">
              <div className="text-center space-y-2 max-w-xs">
                <h2 className="text-xl font-bold">Welcome to RandomChat</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Meet new friends from around the world</p>
              </div>
              
              <div className="w-full max-w-xs space-y-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="What's your name?"
                  className={`w-full px-4 py-2 rounded-md focus:outline-none border ${darkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
                />
                
                <button 
                  onClick={startSearching}
                  className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  Start Chatting
                </button>
              </div>
            </div>
          )}

          {status === 'searching' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-12 h-12 mb-4">
                <div className={`absolute inset-0 border-2 rounded-md animate-spin ${darkMode ? 'border-gray-600 border-t-white' : 'border-gray-300 border-t-black'}`}></div>
              </div>
              <p className="font-medium mb-4">Finding someone to chat with...</p>
              <button 
                onClick={endChat}
                className={`px-4 py-2 rounded-md text-sm focus:outline-none ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
            </div>
          )}

          {status === 'chatting' && (
            <div className="flex flex-col h-full">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.type === 'sent' ? 'justify-end' : msg.type === 'received' ? 'justify-start' : 'justify-center'}`}
                    >
                      {msg.type === 'system' ? (
                        <div className={`px-3 py-1 rounded-md text-xs max-w-xs text-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                          {msg.text}
                        </div>
                      ) : (
                        <div 
                          className={`px-3 py-2 rounded-md max-w-xs break-words text-sm ${msg.type === 'sent' ? darkMode ? 'bg-white text-black' : 'bg-black text-white' : darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}
                        >
                          {msg.text}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className={`rounded-md p-2 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className={`flex-1 px-3 py-2 rounded-md focus:outline-none border text-sm ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'}`}
                  />
                  <button 
                    type="submit"
                    className={`p-2 rounded-md focus:outline-none ${darkMode ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </form>
              </div>

              {/* End Chat Button */}
              <div className="mt-2">
                <button 
                  onClick={endChat}
                  className={`w-full px-4 py-2 rounded-md text-sm focus:outline-none ${darkMode ? 'bg-gray-800 text-red-400 hover:bg-gray-700' : 'bg-gray-100 text-red-600 hover:bg-gray-200'}`}
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