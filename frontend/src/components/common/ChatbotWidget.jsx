import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Headphones, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatbotProductPreview from './ChatbotProductPreview';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { isStaff } from '../../utils/helpers';
import { subscribeTopic, unsubscribeTopic } from '../../services/websocket.service';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [failedCount, setFailedCount] = useState(0);

  // Staff Dashboard States
  const [sessions, setSessions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  const { user } = useAuthStore();
  const messagesEndRef = useRef(null);

  // Resolve Customer/Guest ID
  const getCustomerId = () => {
    if (user && !isStaff(user)) return user.id;
    let guestId = localStorage.getItem('chat_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36).substring(4);
      localStorage.setItem('chat_guest_id', guestId);
    }
    return guestId;
  };

  const customerId = getCustomerId();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Load chat history for a customer thread
  const loadChatHistory = async (cid) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/chat/history?customerId=${cid}`);
      setMessages(res.data);

      // Determine current staff mode based on last SYSTEM message
      let inStaffMode = false;
      for (let i = res.data.length - 1; i >= 0; i--) {
        if (res.data[i].senderRole === 'SYSTEM') {
          if (res.data[i].content.includes("Transferring")) {
            inStaffMode = true;
          }
          break;
        }
      }
      setIsStaffMode(inStaffMode);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load active support sessions for staff
  const loadActiveSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/chat/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to load active sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle customer/guest view loading
  useEffect(() => {
    if (!isStaff(user) && isOpen) {
      loadChatHistory(customerId);
    }
  }, [customerId, isOpen, user]);

  // Handle staff view loading & real-time update subscriptions
  useEffect(() => {
    if (isStaff(user) && isOpen) {
      loadActiveSessions();

      // Subscribe to sessions lists updates
      subscribeTopic('/topic/chat/sessions', (update) => {
        loadActiveSessions();
        // If we are currently viewing the customer who sent a message, reload their history
        if (update && update.customerId === selectedCustomerId) {
          loadChatHistory(update.customerId);
        }
      });

      return () => {
        unsubscribeTopic('/topic/chat/sessions');
      };
    }
  }, [user, isOpen, selectedCustomerId]);

  // Subscribe to real-time chat messages for active customer thread
  useEffect(() => {
    if (!isStaff(user) && isOpen) {
      const topic = `/topic/chat/${customerId}`;
      subscribeTopic(topic, (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          if (newMsg.senderRole === 'SYSTEM') {
            if (newMsg.content.includes("Transferring")) setIsStaffMode(true);
            if (newMsg.content.includes("Switched back")) setIsStaffMode(false);
          }
          return [...prev, newMsg];
        });
      });
      return () => {
        unsubscribeTopic(topic);
      };
    }
  }, [customerId, isOpen, user]);

  // Subscribe to real-time chat messages for staff chatting with selected customer
  useEffect(() => {
    if (isStaff(user) && selectedCustomerId && isOpen) {
      const topic = `/topic/chat/${selectedCustomerId}`;
      subscribeTopic(topic, (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
      return () => {
        unsubscribeTopic(topic);
      };
    }
  }, [selectedCustomerId, isOpen, user]);

  // Connect customer to CSKH staff
  const handleConnectToStaff = async () => {
    if (!user) {
      setMessages(prev => [...prev, {
        id: Date.now() + 100,
        senderRole: 'SYSTEM',
        content: '⚠️ Please sign in to connect with live support staff.'
      }]);
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/chat/toggle-staff', { customerId, enable: true });
    } catch (err) {
      console.error("Failed to connect to staff:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle staff or return to chatbot mode
  const handleToggleStaffMode = async (enable) => {
    const targetCid = isStaff(user) ? selectedCustomerId : customerId;
    if (!targetCid) return;

    try {
      setIsLoading(true);
      await api.post('/chat/toggle-staff', { customerId: targetCid, enable });
      if (!isStaff(user)) {
        setIsStaffMode(enable);
      }
    } catch (err) {
      console.error("Failed to toggle staff mode:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Staff Dashboard handlers
  const handleSelectSession = (session) => {
    setSelectedCustomerId(session.customerId);
    setSelectedCustomerName(session.customerName);
    loadChatHistory(session.customerId);
  };

  const handleBackToSessions = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerName('');
    setMessages([]);
    loadActiveSessions();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const rawInput = input.trim();
    if (!rawInput) return;

    setInput('');

    const targetCid = isStaff(user) ? selectedCustomerId : customerId;

    const requestBody = {
      customerId: targetCid,
      senderId: user ? user.id : null,
      senderName: user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username : 'Guest User',
      senderRole: isStaff(user) ? 'STAFF' : 'CUSTOMER',
      content: rawInput
    };

    // Add message optimistically
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      customerId: requestBody.customerId,
      senderId: requestBody.senderId,
      senderName: requestBody.senderName,
      senderRole: requestBody.senderRole,
      content: requestBody.content,
      createAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await api.post('/chat/send', requestBody);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        const newMsgs = res.data.filter(newM => !filtered.some(m => m.id === newM.id));
        return [...filtered, ...newMsgs];
      });

      // Handle AI fallback prompts locally
      if (!isStaff(user)) {
        const botReply = res.data.find(m => m.senderRole === 'BOT')?.content || '';
        if (botReply) {
          const isFallback = botReply.includes("didn't quite catch") || 
                              botReply.includes("experiencing connection issues") ||
                              botReply.includes("Sorry, I am having trouble");
          if (isFallback) {
            setFailedCount(prev => prev + 1);
          } else {
            setFailedCount(0);
          }
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessages(prev => [...prev, {
        id: Date.now() + 999,
        senderRole: 'SYSTEM',
        content: '⚠️ Failed to send message. Please try again.'
      }]);
    }
  };

  const renderMessageList = () => {
    const renderFormattedText = (text, isMe) => {
      const combinedRegex = /(\[PRODUCT:[^\]]+\]|\[([^\]]+)\]\([^)]+\))/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = combinedRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        
        const token = match[0];
        if (token.startsWith('[PRODUCT:')) {
          const keyword = token.substring(9, token.length - 1); // Extract keyword
          parts.push(<ChatbotProductPreview key={lastIndex} keyword={keyword} />);
        } else {
          // Standard markdown link
          const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
          if (linkMatch) {
            const label = linkMatch[1];
            const url = linkMatch[2];
            
            const linkClass = isMe 
              ? "text-blue-100 underline font-semibold hover:text-white transition-colors" 
              : "text-blue-600 underline font-semibold hover:text-blue-800 transition-colors";

            if (url.startsWith('/')) {
              parts.push(
                <Link key={lastIndex} to={url} className={linkClass}>
                  {label}
                </Link>
              );
            } else {
              parts.push(
                <a key={lastIndex} href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {label}
                </a>
              );
            }
          }
        }
        lastIndex = combinedRegex.lastIndex;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }
      return parts.length > 0 ? parts : text;
    };

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          if (msg.senderRole === 'SYSTEM') {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="inline-block bg-gray-200/80 text-gray-700 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                  {msg.content}
                </span>
              </div>
            );
          }

          const isMe = (isStaff(user) && (msg.senderRole === 'STAFF' || msg.senderRole === 'ADMIN')) ||
                       (!isStaff(user) && msg.senderRole === 'CUSTOMER');
          const isStaffSender = msg.senderRole === 'STAFF' || msg.senderRole === 'ADMIN';

          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isMe ? 'bg-gray-400 text-white' : isStaffSender ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {isMe ? <User className="w-4 h-4" /> : isStaffSender ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                isMe 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : isStaffSender 
                    ? 'bg-white text-gray-800 border-l-4 border-l-blue-600 border-gray-100 rounded-bl-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}>
                {renderFormattedText(msg.content, isMe)}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-end gap-2">
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 ${isStaffMode ? 'bg-blue-600' : 'bg-red-600'}`}>
              {isStaffMode ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}

        {failedCount >= 1 && !isStaffMode && !isStaff(user) && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-gray-800 space-y-3 shadow-sm">
            <p className="leading-relaxed">💡 It looks like the virtual assistant couldn't fully answer your question. Would you like to connect with our online support staff for direct assistance?</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleConnectToStaff}
                className="w-full bg-blue-600 text-white font-semibold py-2 px-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <Headphones className="w-4 h-4" /> Connect with CSKH Staff (Online)
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  const renderStaffSessions = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageSquare className="w-12 h-12 mb-2 stroke-1" />
            <p className="text-sm">No active chat sessions.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map(s => (
              <div 
                key={s.customerId}
                onClick={() => handleSelectSession(s)}
                className="p-4 hover:bg-white cursor-pointer transition flex items-center justify-between border-b border-gray-100"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">{s.customerName}</h4>
                    {s.waitingForStaff && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Needs staff assistance"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{s.customerEmail || 'Guest session'}</p>
                  <p className="text-xs text-gray-600 truncate mt-1.5">{s.lastMessage}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {new Date(s.lastMessageTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slide-in-up">
          {/* Header */}
          <div className={`${isStaff(user) ? 'bg-blue-600' : isStaffMode ? 'bg-blue-600' : 'bg-red-600'} text-white p-4 flex items-center justify-between shadow-md transition-colors duration-300`}>
            {isStaff(user) ? (
              selectedCustomerId ? (
                <div className="flex items-center gap-2 w-full pr-4">
                  <button onClick={handleBackToSessions} className="text-white hover:bg-white/10 p-1 rounded transition-colors mr-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{selectedCustomerName}</h3>
                    <p className="text-xs text-blue-100">Live Support Chat</p>
                  </div>
                  <button 
                    onClick={() => handleToggleStaffMode(false)} 
                    className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/35 transition shrink-0"
                  >
                    Bot Mode
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Support Dashboard</h3>
                    <p className="text-xs text-blue-100">Active Sessions</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 w-full pr-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {isStaffMode ? <Headphones className="w-5 h-5 animate-pulse" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {isStaffMode ? 'CSKH Staff (Tuan Minh)' : 'MBServices Assistant'}
                  </h3>
                  <p className="text-xs text-blue-100">Online - Ready to help</p>
                </div>
                {isStaffMode && (
                  <button 
                    onClick={() => handleToggleStaffMode(false)} 
                    className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/35 transition shrink-0"
                  >
                    Use Bot
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          {isStaff(user) && !selectedCustomerId ? renderStaffSessions() : renderMessageList()}

          {/* Input Panel */}
          {(!isStaff(user) || selectedCustomerId) && (
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isStaff(user) ? "Type a reply as Staff..." : isStaffMode ? "Type a message to CSKH..." : "Ask the virtual assistant..."}
                  className="w-full bg-gray-100 border-transparent rounded-full pl-4 pr-12 py-2.5 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-1.5 w-8 h-8 flex items-center justify-center ${(isStaff(user) || isStaffMode) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-white text-red-600 rotate-90 scale-90' 
            : 'bg-red-600 text-white hover:bg-red-700 hover:scale-110 animate-float'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default ChatbotWidget;