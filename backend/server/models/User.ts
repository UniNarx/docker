// server/models/User.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose'; // Добавляем Types
import { IRole } from './Role';

export interface IUser extends Document<Types.ObjectId> { // Указываем тип для _id в Document
  _id: Types.ObjectId; // Явно типизируем _id
  username: string;
  passwordHash: string;
  role: Types.ObjectId | IRole; // Может быть ObjectId или populated IRole
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true }, // Можно явно определить _id, auto: true - по умолчанию
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || model<IUser>('User', UserSchema);
export default User;