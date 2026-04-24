'use client'

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { ChatMessageData, ChatParticipant } from '@/types/chat';
import { Send, UserCircle, AlertTriangle, Hash, Clock } from 'lucide-react';
import Image from 'next/image';

interface ChatWindowProps {
  messages: ChatMessageData[];
  currentUser: ChatParticipant;
  otherParticipant: ChatParticipant;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  chatError?: string | null;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUser,
  otherParticipant,
  onSendMessage,
  isLoading,
  chatError,
  onLoadMoreMessages,
  hasMoreMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const lastMessage = messages[messages.length - 1];
        const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 150;

        if (messages.length > 0 && (!lastMessage || lastMessage.sender.id !== currentUser.id || isScrolledToBottom)) {
            if (messages.length <= 20 || isScrolledToBottom || (lastMessage && lastMessage.sender.id !== currentUser.id)) {
                 setTimeout(() => scrollToBottom("auto"), 100);
            }
        }
    }
  }, [messages, currentUser.id]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };
  
  const handleScroll = () => {
    if (chatContainerRef.current && chatContainerRef.current.scrollTop === 0 && hasMoreMessages && onLoadMoreMessages && !isLoading) {
        onLoadMoreMessages();
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, onLoadMoreMessages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] relative" style={{ 
      backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`, 
      backgroundSize: '24px 24px' 
    }}>
      
      {/* HEADER: Строгий и чистый */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            {otherParticipant.avatarUrl ? (
                <Image src={otherParticipant.avatarUrl} alt={otherParticipant.username} width={44} height={44} className="rounded-xl object-cover border border-slate-100 shadow-sm"/>
            ) : (
                <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <UserCircle size={24} strokeWidth={1.5} />
                </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">{otherParticipant.username}</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Session</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
           <Hash size={12} className="text-slate-300" />
           <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter">Terminal // 04-A</span>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
      >
        {chatError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-tight">
                <AlertTriangle className="w-4 h-4"/>
                {chatError}
            </div>
        )}

        {hasMoreMessages && (
             <div className="flex justify-center pb-4">
                <button
                    onClick={onLoadMoreMessages}
                    disabled={isLoading}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-2 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 rounded-full"
                >
                    {isLoading ? 'Загрузка...' : 'Загрузить историю'}
                </button>
            </div>
        )}

        {messages.map((msg, index) => {
          const isCurrentUserSender = msg.sender.id === currentUser.id;
          const messageDate = new Date(msg.timestamp);
          const displayTime = messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

          let showDateSeparator = false;
          if (index === 0) {
            showDateSeparator = true;
          } else {
            const prevMessageDate = new Date(messages[index - 1].timestamp);
            if (messageDate.toDateString() !== prevMessageDate.toDateString()) {
              showDateSeparator = true;
            }
          }

          return (
            <React.Fragment key={msg._id || `msg-${index}`}>
              {showDateSeparator && (
                <div className="flex items-center gap-4 my-8">
                  <div className="h-[1px] flex-1 bg-slate-200/60" />
                  <span className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-[0.3em]">
                    {messageDate.toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}
                  </span>
                  <div className="h-[1px] flex-1 bg-slate-200/60" />
                </div>
              )}
              
              <div className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex flex-col ${isCurrentUserSender ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  
                  <div
                    className={`px-5 py-4 shadow-sm border ${
                      isCurrentUserSender
                        ? 'bg-slate-900 border-slate-800 text-white rounded-[24px] rounded-br-none shadow-slate-200 shadow-xl'
                        : 'bg-white border-slate-200 text-slate-900 rounded-[24px] rounded-bl-none'
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed font-medium whitespace-pre-wrap tracking-tight">
                      {msg.message || msg.text}
                    </p>
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-2 px-1`}>
                    {!isCurrentUserSender && (
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{msg.sender.username}</span>
                    )}
                    <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-300">
                      <Clock size={10} />
                      {displayTime}
                    </div>
                    {isCurrentUserSender && (
                      <div className={`text-[10px] font-black ${msg.read ? 'text-blue-500' : 'text-slate-300'}`}>
                        {msg.read ? '• DONE' : '• SENT'}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA: Монолитный блок */}
      <div className="p-8 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 border border-slate-200 p-2 rounded-2xl focus-within:border-slate-400 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 placeholder-slate-400 font-bold tracking-tight focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="group flex items-center justify-center w-11 h-11 bg-slate-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-20 disabled:grayscale"
          >
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </form>
        <div className="mt-4 flex justify-center">
            <p className="text-[9px] font-mono font-bold text-slate-300 uppercase tracking-[0.4em]">Press Enter to dispatch</p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;