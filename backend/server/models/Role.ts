// server/models/Role.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose'; // Добавляем Types

export interface IRole extends Document<Types.ObjectId> { // Указываем тип для _id
  _id: Types.ObjectId; // Явно типизируем _id
  name: string;
}

const RoleSchema = new Schema<IRole>({
  _id: { type: Schema.Types.ObjectId, auto: true }, // Можно явно определить _id
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Role: Model<IRole> = mongoose.models.Role || model<IRole>('Role', RoleSchema);
export default Role;