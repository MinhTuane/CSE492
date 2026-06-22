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

  // Staff Dashboard States
  const [sessions, setSessions] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  // Rating States
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

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

      // Determine current staff mode and rating prompt visibility based on last messages
      let inStaffMode = false;
      let needsRating = false;
      for (let i = res.data.length - 1; i >= 0; i--) {
        const msg = res.data[i];
        if (msg.senderRole === 'SYSTEM') {
          if (msg.content.includes("Transferring")) {
            inStaffMode = true;
          }
          if (msg.content.includes("đã kết thúc")) {
            needsRating = true;
          }
          if (msg.content.includes("đã quay lại") || msg.content.includes("Đã quay lại")) {
            needsRating = false;
          }
          break;
        }
      }
      setIsStaffMode(inStaffMode);
      if (!isStaff(user)) {
        setShowRating(needsRating);
      }
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
            if (newMsg.content.includes("đã kết thúc")) {
              setShowRating(true);
              setIsStaffMode(false);
            }
            if (newMsg.content.includes("đã quay lại") || newMsg.content.includes("Đã quay lại")) {
              setShowRating(false);
            }
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

  // Accept a chat session by a staff member
  const handleAcceptChat = async () => {
    if (!selectedCustomerId) return;
    try {
      setIsLoading(true);
      await api.post('/chat/accept', {
        customerId: selectedCustomerId,
        staffId: user.id,
        staffName: `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username
      });
      await loadActiveSessions();
      await loadChatHistory(selectedCustomerId);
    } catch (err) {
      console.error("Failed to accept chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Leave / close a chat session by a staff member
  const handleLeaveChat = async () => {
    const targetCid = isStaff(user) ? selectedCustomerId : customerId;
    if (!targetCid) return;
    try {
      setIsLoading(true);
      await api.post('/chat/close', { customerId: targetCid });
      if (isStaff(user)) {
        handleBackToSessions();
      }
    } catch (err) {
      console.error("Failed to leave chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send rating for support
  const handleSendRating = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsLoading(true);
      await api.post('/chat/rate', {
        customerId,
        rating,
        feedback
      });
      setShowRating(false);
      setFeedback('');
      setRating(5);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip rating for support
  const handleSkipRating = async () => {
    try {
      setIsLoading(true);
      await api.post('/chat/rate', {
        customerId,
        rating: 0,
        feedback: ''
      });
      setShowRating(false);
      setFeedback('');
      setRating(5);
    } catch (err) {
      console.error("Failed to skip rating:", err);
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

      // Handle AI fallback prompts locally: automatically connect to staff if AI fails
      if (!isStaff(user)) {
        const botReply = res.data.find(m => m.senderRole === 'BOT')?.content || '';
        if (botReply) {
          const isFallback = botReply.includes("didn't quite catch") || 
                              botReply.includes("experiencing connection issues") ||
                              botReply.includes("Sorry, I am having trouble") ||
                              botReply.includes("receiving too many requests");
          if (isFallback) {
            handleConnectToStaff();
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


        <div ref={messagesEndRef} />
      </div>
    );
  };

  const renderRatingView = () => {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50 text-center space-y-5">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800">Đánh giá dịch vụ hỗ trợ</h4>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed px-2">
            Phiên hỗ trợ trực tuyến đã kết thúc. Bạn vui lòng dành chút thời gian đánh giá chất lượng phục vụ của nhân viên tư vấn.
          </p>
        </div>
        
        {/* Star Rating Selection */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((starVal) => {
            const isHighlighted = starVal <= (hoveredRating || rating);
            return (
              <button
                type="button"
                key={starVal}
                onMouseEnter={() => setHoveredRating(starVal)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(starVal)}
                className="focus:outline-none transition-transform hover:scale-125"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isHighlighted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-8 h-8 transition-colors ${isHighlighted ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>

        {/* Feedback Comment Input */}
        <div className="w-full px-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Để lại lời nhắn đóng góp ý kiến (không bắt buộc)..."
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3 px-2 pt-2">
          <button
            onClick={handleSkipRating}
            disabled={isLoading}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-100 transition-colors text-xs disabled:opacity-50"
          >
            Bỏ qua
          </button>
          <button
            onClick={handleSendRating}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors text-xs shadow-md disabled:opacity-50"
          >
            Gửi đánh giá
          </button>
        </div>
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
            {sessions.map(s => {
              const isAssignedToMe = s.assignedStaffId === user?.id;
              return (
                <div 
                  key={s.customerId}
                  onClick={() => handleSelectSession(s)}
                  className="p-4 hover:bg-white cursor-pointer transition flex items-center justify-between border-b border-gray-100"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-sm text-gray-800 truncate">{s.customerName}</h4>
                      {s.waitingForStaff && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Needs staff assistance"></span>
                      )}
                      {s.assignedStaffId ? (
                        isAssignedToMe ? (
                          <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">Tôi</span>
                        ) : (
                          <span className="text-[9px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded truncate max-w-[80px]" title={s.assignedStaffName}>
                            {s.assignedStaffName}
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] bg-blue-50 text-blue-600 font-medium px-1.5 py-0.5 rounded">Chưa nhận</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{s.customerEmail || 'Guest session'}</p>
                    <p className="text-xs text-gray-600 truncate mt-1.5">{s.lastMessage}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(s.lastMessageTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const selectedSession = sessions.find(s => s.customerId === selectedCustomerId);

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
                  {selectedSession?.assignedStaffId === user?.id && (
                    <button 
                      onClick={handleLeaveChat} 
                      className="text-[10px] bg-red-500 px-2 py-1 rounded hover:bg-red-600 transition shrink-0 font-semibold shadow-sm mr-1"
                    >
                      Rời Chat
                    </button>
                  )}
                  {!selectedSession?.assignedStaffId && (
                    <button 
                      onClick={() => handleToggleStaffMode(false)} 
                      className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/35 transition shrink-0"
                    >
                      Bot Mode
                    </button>
                  )}
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
                    {isStaffMode ? 'CSKH Staff' : 'MBServices Assistant'}
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
          {isStaff(user) && !selectedCustomerId ? renderStaffSessions() : (showRating ? renderRatingView() : renderMessageList())}

          {/* Input Panel */}
          {(!isStaff(user) || selectedCustomerId) && !showRating && (
            isStaff(user) && selectedCustomerId ? (
              (() => {
                if (!selectedSession?.assignedStaffId) {
                  return (
                    <div className="p-3 bg-white border-t border-gray-100 flex justify-center">
                      <button
                        type="button"
                        onClick={handleAcceptChat}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                      >
                        <Headphones className="w-4 h-4" /> Nhận hỗ trợ cuộc trò chuyện
                      </button>
                    </div>
                  );
                } else if (selectedSession.assignedStaffId !== user?.id && !selectedSession.allowedStaffIds?.includes(user?.id)) {
                  return (
                    <div className="p-3.5 bg-gray-100 border-t border-gray-200 text-center text-xs text-gray-500 font-medium flex items-center justify-center gap-1.5">
                      <span>🔒 Cuộc trò chuyện đang được hỗ trợ bởi <b>{selectedSession.assignedStaffName || 'nhân viên khác'}</b>.</span>
                    </div>
                  );
                } else {
                  return (
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Nhập nội dung phản hồi..."
                          className="w-full bg-gray-100 border-transparent rounded-full pl-4 pr-12 py-2.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                        />
                        <button 
                          type="submit" 
                          disabled={!input.trim() || isLoading}
                          className="absolute right-1.5 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </form>
                  );
                }
              })()
            ) : (
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isStaffMode ? "Nhập nội dung gửi CSKH..." : "Hỏi trợ lý ảo..."}
                    className="w-full bg-gray-100 border-transparent rounded-full pl-4 pr-12 py-2.5 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className={`absolute right-1.5 w-8 h-8 flex items-center justify-center ${isStaffMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            )
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