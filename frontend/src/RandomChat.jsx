import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function RandomChat() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, searching, chatting
  const [partner, setPartner] = useState('');
  const messagesEndRef = useRef(null);

  // Connect to socket when component mounts
  useEffect(() => {
    // In production, replace with your actual server URL
    const newSocket = io('/');
    setSocket(newSocket);

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
      <path d="M0 0C4 0 10 4 10 10H0V0Z" fill="#E9F5FF" />
    </svg>
  );

  const SpeechBubbleRight = () => (
    <svg className="absolute right-0 bottom-0 transform translate-x-2 translate-y-1" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C6 0 0 4 0 10H10V0Z" fill="#FFE9F3" />
    </svg>
  );

  return (
    <div className="flex flex-col min-h-screen bg-yellow-50">
      <div className="flex flex-col max-w-lg mx-auto my-8 w-full h-screen sm:h-auto sm:max-h-[700px] rounded-3xl overflow-hidden shadow-xl border-4 border-orange-300 bg-white">
        {/* Header */}
        <div className="bg-orange-400 px-6 py-4 border-b-4 border-orange-500">
          <h1 className="text-3xl font-bold text-white text-center font-comic">RandomChat</h1>
          {status === 'chatting' && (
            <div className="text-sm text-white text-center mt-1 flex items-center justify-center">
              <div className="h-3 w-3 bg-green-400 border border-white rounded-full mr-2 animate-pulse"></div>
              Chatting with {partner}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-4 bg-yellow-50">
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center space-y-6 h-full">
              <div className="text-center space-y-2 max-w-xs">
                <h2 className="text-2xl font-bold text-orange-500">Welcome to RandomChat!</h2>
                <p className="text-gray-600">Meet new friends from around the world!</p>
              </div>
              
              <div className="w-full max-w-xs space-y-4 mt-4">
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="What's your name?"
                    className="w-full px-4 py-3 rounded-full border-2 border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent text-gray-800 bg-white shadow-sm"
                  />
                </div>
                
                <button 
                  onClick={startSearching}
                  className="w-full bg-green-400 hover:bg-green-500 text-white py-3 px-4 rounded-full font-bold border-2 border-green-500 shadow-md transform transition-transform hover:scale-105 focus:outline-none"
                >
                  Let's Chat! 😊
                </button>
              </div>
            </div>
          )}

          {status === 'searching' && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-green-300 border-b-green-500 rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="text-orange-500 font-bold text-xl mb-4">Finding someone fun to chat with...</p>
              <button 
                onClick={endChat}
                className="px-6 py-2 bg-orange-100 text-orange-500 rounded-full border-2 border-orange-300 hover:bg-orange-200 transition-colors focus:outline-none shadow-sm"
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
                        <div className="bg-yellow-100 text-orange-600 px-4 py-2 rounded-full text-sm max-w-xs text-center border border-yellow-200">
                          {msg.text}
                        </div>
                      ) : (
                        <div 
                          className={`relative px-4 py-2 rounded-2xl max-w-xs break-words ${
                            msg.type === 'sent' 
                              ? 'bg-pink-100 text-pink-800 mr-1 border-2 border-pink-200' 
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
              <div className="bg-white rounded-2xl p-3 border-2 border-orange-200">
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 border-2 border-orange-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-800 bg-orange-50"
                  />
                  <button 
                    type="submit"
                    className="bg-green-400 hover:bg-green-500 text-white p-3 rounded-full focus:outline-none border-2 border-green-500 transform transition-transform hover:scale-105"
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
                  className="w-full px-4 py-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition-colors focus:outline-none border-2 border-red-200 font-bold"
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