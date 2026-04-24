'use client'

import React from 'react';
import { ConversationData, ChatParticipant } from '@/types/chat';
import Image from 'next/image';
import { UserCircle, Hash } from 'lucide-react';

interface ConversationListProps {
  conversations: ConversationData[];
  currentUserId: string;
  onSelectConversation: (conversation: ConversationData) => void;
  activeConversationId?: string | null;
  activeChatUsers: ChatParticipant[];
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelectConversation,
  activeConversationId,
  activeChatUsers,
}) => {
  if (!conversations || conversations.length === 0) return null;

  const onlineUserIds = new Set(activeChatUsers.map(u => u.id));

  return (
    <ul className="divide-y divide-slate-100 bg-white overflow-hidden">
      {conversations.map((convo) => {
        const otherParticipant = convo.otherParticipant;
        const lastMsg = convo.lastMessage;
        const isActive = convo.conversationId === activeConversationId;
        const isOnline = onlineUserIds.has(otherParticipant.id);

        const isLastMessageFromCurrentUser = lastMsg.senderId === currentUserId;
        const lastMessageText = isLastMessageFromCurrentUser
          ? `Вы: ${lastMsg.text}`
          : lastMsg.text;

        let displayTime = '';
        if (lastMsg.timestamp) {
          const msgDate = new Date(lastMsg.timestamp);
          const today = new Date();
          displayTime = msgDate.toDateString() === today.toDateString()
            ? msgDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            : msgDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
        }

        return (
          <li key={convo.conversationId} className="relative overflow-hidden">
            {/* Акцентная полоса при выборе */}
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900 z-10" />
            )}
            
            <button
              onClick={() => onSelectConversation(convo)}
              className={`w-full text-left p-5 transition-all duration-200 focus:outline-none relative ${
                isActive ? 'bg-slate-50' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Аватар в стиле "Блок" */}
                <div className="relative flex-shrink-0">
                  {otherParticipant.avatarUrl ? (
                    <Image
                      src={otherParticipant.avatarUrl}
                      alt={otherParticipant.username}
                      width={48}
                      height={48}
                      className="rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isActive ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <UserCircle size={24} strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* Индикатор онлайна: минималистичный ромб */}
                  {isOnline && (
                    <span className="absolute -top-1 -right-1 block h-3 w-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <p className={`text-sm font-black tracking-tight truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                      {otherParticipant.username.toUpperCase()}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {displayTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate pr-4 tracking-tight ${
                      isActive ? 'text-slate-600' : 'text-slate-400'
                    } ${(!isLastMessageFromCurrentUser && convo.unreadCount > 0 && !isActive) ? 'font-black text-slate-900' : 'font-medium'}`}>
                      {lastMessageText}
                    </p>
                    
                    {convo.unreadCount > 0 && !isActive && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-600 text-[9px] font-black text-white px-1.5 rounded-md shadow-sm shadow-blue-200 transition-transform animate-in zoom-in-50">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ConversationList;