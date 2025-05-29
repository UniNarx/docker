// backend/server/models/ChatMessage.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IChatMessage extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  sender: Types.ObjectId | IUser;    // Отправитель (User ID)
  receiver: Types.ObjectId | IUser;  // Получатель (User ID)
  message: string;                   // Текст сообщения
  timestamp: Date;                   // Время отправки
  read: boolean;                     // Прочитано ли сообщение (опционально)
  conversationId: string;            // Уникальный ID для диалога между двумя пользователями
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    conversationId: { // Генерируется из ID отправителя и получателя
      type: String,
      required: true,
      index: true, // Индексируем для быстрого поиска диалогов
    }
  },
  {
    timestamps: true, // Добавляет createdAt и updatedAt
  }
);

// Индекс для поиска сообщений в диалоге, отсортированных по времени
ChatMessageSchema.index({ conversationId: 1, timestamp: -1 });

const ChatMessage: mongoose.Model<IChatMessage> =
  mongoose.models.ChatMessage || model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
