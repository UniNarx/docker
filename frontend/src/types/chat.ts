// frontend/src/types/chat.ts

// Информация о пользователе в контексте чата
export interface ChatParticipant {
  _id: string; // MongoDB ID
  id: string;  // Для удобства на фронтенде, обычно совпадает с _id
  username: string;
  avatarUrl?: string;
  isOnline?: boolean; // Добавим флаг онлайна
}

// Сообщение чата
export interface ChatMessageData {
  _id: string;
  id: string;
  sender: ChatParticipant;
  receiver: ChatParticipant;
  message: string;
  text?: string;
  timestamp: string | Date;
  read?: boolean;
  conversationId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Диалог/Переписка
export interface ConversationData {
  conversationId: string;
  lastMessage: {
    _id: string;
    text: string;
    timestamp: string | Date;
    senderId: string;
    receiverId: string;
    read?: boolean;
  };
  otherParticipant: ChatParticipant; // Собеседник теперь ChatParticipant
  unreadCount: number;
}

// Типы для сообщений WebSocket
export interface WebSocketOutgoingMessage {
  receiverId: string;
  text: string;
}

export interface WebSocketIncomingMessage {
  type:
    | 'newMessage'
    | 'error'
    | 'messageSentConfirmation'
    | 'historyLoaded'
    | 'conversationsLoaded'
    | 'userStatus' // Общий статус пользователя (если будете расширять)
    | 'info'
    | 'activeUserList'   // Новый тип: полный список активных пользователей
    | 'userJoined'       // Новый тип: пользователь подключился
    | 'userLeft';        // Новый тип: пользователь отключился
  payload: any;
}

// Более конкретные типы для входящих сообщений
export interface NewMessagePayload extends ChatMessageData {}

export interface ErrorPayload {
  message: string;
  details?: any;
}

export interface ActiveUserListPayload {
  users: ChatParticipant[]; // Бэкенд будет слать { id, _id, username }
}

export interface UserJoinedPayload extends ChatParticipant {} // Бэкенд будет слать { id, _id, username }

export interface UserLeftPayload {
  userId: string;
}


// Ответ от API для истории сообщений
export interface ChatHistoryResponse {
  messages: ChatMessageData[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}
