// server/models/DoctorProfile.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface IDoctorProfile extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser; // Связь с пользователем
  // Здесь можно добавить специфичные для профиля врача поля в будущем,
  // например, биография, сертификаты, часы работы и т.д.
  // Пока что, для соответствия минималистичной Go-структуре, оставляем так.
  createdAt: Date;
  updatedAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Один пользователь - один профиль врача
    },
    // Пример дополнительных полей (пока закомментированы):
    // biography: { type: String, trim: true },
    // officeHours: { type: String },
  },
  {
    timestamps: true,
  }
);

const DoctorProfile: Model<IDoctorProfile> =
  mongoose.models.DoctorProfile || model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);

export default DoctorProfile;