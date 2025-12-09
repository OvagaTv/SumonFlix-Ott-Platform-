import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageSquare, Headphones } from 'lucide-react';
import { getGeminiRecommendation } from '../services/geminiService';
import { ChatMessage } from '../types';

interface GeminiAssistantProps {
  language: 'en' | 'bn';
  messages: ChatMessage[];
  onSendMessage: (text: string, role: 'user' | 'model' | 'support') => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ language, messages, onSendMessage, isLoading, setLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Send User Message
    onSendMessage(input, 'user');
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const responseText = await getGeminiRecommendation(userInput, language);
      onSendMessage(responseText, 'model');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-900/50 flex items-center justify-center text-white hover:scale-110 transition-transform z-40 group"
        >
          <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              <h3 className="font-semibold text-white">sumonflix.net</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm relative ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : msg.role === 'support' 
                        ? 'bg-purple-700 text-white rounded-tl-none border border-purple-500' 
                        : 'bg-slate-700 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.role === 'support' && (
                      <span className="block text-[10px] uppercase font-bold text-purple-200 mb-1 flex items-center gap-1">
                          <Headphones size={10} /> Support
                      </span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'bn' ? "মুভির জন্য জিজ্ঞাসা করুন..." : "Ask for a movie or support..."}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;