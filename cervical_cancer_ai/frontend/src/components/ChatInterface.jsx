import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChatInterface = ({ analysisResults }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: "Hello 👋 I'm your AI health assistant. I have access to your latest scan results. Ask me about your risk or next steps."
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
  e.preventDefault();
  if (!inputText.trim()) return;

  const userMessage = { id: Date.now(), type: 'user', text: inputText };
  setMessages(prev => [...prev, userMessage]);
  setInputText('');
  setIsTyping(true);

  try {
    // 🧬 THE FIX: Pull directly from storage right when 'Send' is clicked
    const storedPrediction = JSON.parse(localStorage.getItem("prediction"));
    
    // Fallback logic to ensure results is never null
    const currentResults = analysisResults || storedPrediction || {};

    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: inputText,
        results: currentResults // This sends the LOW/HIGH data to Python
      })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { id: Date.now()+1, type: 'ai', text: data.reply }]);

  } catch (error) {
    setMessages(prev => [...prev, { id: Date.now()+2, type: 'ai', text: "⚠️ Connection error." }]);
  } finally {
    setIsTyping(false);
  }
};
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-xl">
      {/* HEADER SECTION */}
      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medical Hub Active</span>
        </div>
        <Bot size={18} className="text-indigo-500" />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-gradient-to-b from-white to-slate-50/30">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border ${
                msg.type === 'ai' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                {msg.type === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>

              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm border whitespace-pre-wrap ${
                msg.type === 'ai'
                  ? 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
                  : 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask: 'What is my risk?'"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 placeholder-slate-400 font-bold transition-all"
          />

          <Button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="absolute right-2 top-2 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-transform active:scale-90"
          >
            <Send size={18} />
          </Button>
        </form>
        <div className="flex items-center justify-center gap-2 mt-3 opacity-50">
           <AlertCircle size={10} className="text-slate-400" />
           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
             Clinical Support Mode Active
           </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;