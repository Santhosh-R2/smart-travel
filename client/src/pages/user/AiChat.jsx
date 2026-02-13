import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, Loader, Bot, User, Sparkles, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import '../../styles/AiChat.css';

const AiChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!fetchingHistory) {
            scrollToBottom();
        }
    }, [messages, loading, fetchingHistory]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('userInfo'));
                const userId = user ? (user.id || user._id) : null;
                
                if (!userId) {
                    setMessages([{ 
                        id: 'init-1', 
                        sender: 'ai', 
                        text: "Hello! I'm your AI Travel Assistant. Please log in to save your chat history." 
                    }]);
                    setFetchingHistory(false);
                    return;
                }

                const res = await axios.get(`http://localhost:5001/history?userId=${userId}`);
                if (res.data.messages && res.data.messages.length > 0) {
                    setMessages(res.data.messages.map((m, i) => ({ ...m, id: i })));
                } else {
                    setMessages([{ 
                        id: 'init-2', 
                        sender: 'ai', 
                        text: "Namaste! 🙏 I'm your Smart Travel Guide. Ask me about hidden gems in Kerala, budget trips to Goa, or adventure spots in the Himalayas!" 
                    }]);
                }
            } catch (err) {
                console.error("History fetch error", err);
                setMessages([{ id: 'init-err', sender: 'ai', text: "Hello! I'm ready to help plan your trip." }]);
            } finally {
                setTimeout(() => setFetchingHistory(false), 800);
            }
        };
        fetchHistory();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('userInfo'));
            const userId = user ? (user.id || user._id) : null;

            const res = await axios.post('http://localhost:5001/chat', {
                message: userMsg.text,
                userId: userId
            });

            const aiResponse = res.data;
            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: aiResponse.text || "Here is what I found for you:",
                image: aiResponse.image || null,
                suggestions: aiResponse.suggestions || []
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                sender: 'ai', 
                text: "I'm having trouble connecting to the travel database. Please check your connection." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        if (window.confirm("Are you sure you want to clear this conversation?")) {
            try {
                const user = JSON.parse(localStorage.getItem('userInfo'));
                const userId = user ? (user.id || user._id) : null;
                if (userId) {
                    await axios.delete(`http://localhost:5001/history?userId=${userId}`);
                }
                setMessages([{ 
                    id: Date.now(), 
                    sender: 'ai', 
                    text: "Chat cleared! Where would you like to go next?" 
                }]);
                toast.success("History cleared");
            } catch (err) {
                toast.error("Failed to clear history");
            }
        }
    };

    return (
        <div className="ai-chat-layout">
            <div className="ai-chat-container">
                
                <header className="ai-chat-header">
                    <div className="ai-header-info">
                        <div className="ai-avatar-circle">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2>Travel Assistant</h2>
                            <div className="ai-status-wrapper">
                                <span className="ai-status-dot"></span>
                                <span className="ai-status-text">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={clearChat} className="ai-header-btn" title="Clear Conversation">
                        <Trash2 size={20} />
                    </button>
                </header>

                <div className="ai-messages-area">
                    {fetchingHistory ? (
                        <div className="ai-loading-container">
                            <div className="ai-loading-state">
                                <Loader className="spin" size={40} />
                                <p>Syncing travel memories...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="message-list">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                                    <div className="message-avatar">
                                        {msg.sender === 'ai' ? <Bot size={22} /> : <User size={22} />}
                                    </div>

                                    <div className="message-content-wrapper">
                                        {msg.image && (
                                            <div className="ai-media-container">
                                                <img src={msg.image} alt="Location" loading="lazy" />
                                                <div className="media-overlay">
                                                    <MapPin size={12} /> Destination Preview
                                                </div>
                                            </div>
                                        )}

                                        <div className="message-bubble">
                                            <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                                        </div>

                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className="ai-cards-grid">
                                                {msg.suggestions.map((place, idx) => (
                                                    <div key={idx} className="ai-mini-card">
                                                        <div className="ai-card-img-wrap">
                                                            <img src={place.image_url} alt={place.name} onError={(e) => e.target.style.display='none'} />
                                                        </div>
                                                        <div className="ai-card-details">
                                                            <h4>{place.name}</h4>
                                                            <span className="ai-budget-tag">{place.budget_range}</span>
                                                            <p>{place.description}</p>
                                                            <div className="ai-tags-row">
                                                                {place.tags?.slice(0, 2).map(t => <span key={t}>#{t}</span>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="ai-message-row ai">
                                    <div className="message-avatar"><Bot size={22} /></div>
                                    <div className="message-content-wrapper">
                                        <div className="message-bubble loading-bubble">
                                            <div className="typing-indicator">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="ai-input-wrapper">
                    <form className="ai-input-box" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Ask me anything about cities, hotels, or trips..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <button type="submit" disabled={loading || !input.trim()} className={input.trim() ? 'active' : ''}>
                            {loading ? <Loader className="spin" size={20} /> : <Send size={20} />}
                        </button>
                    </form>
                    <p className="ai-disclaimer">AI-generated content. Please verify travel safety before booking.</p>
                </div>
            </div>
        </div>
    );
};

export default AiChat;