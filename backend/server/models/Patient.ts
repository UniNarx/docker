// server/models/Patient.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User'; // Для ссылки на пользователя

export interface IPatient extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser; // Ссылка на пользователя (может быть ObjectId или populated IUser)
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  // createdAt и updatedAt будут добавлены через timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: { // Связь с пользователем, который является этим пациентом
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Один пользователь может быть только одним пациентом
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Добавляет createdAt и updatedAt
  }
);

const Patient: Model<IPatient> = mongoose.models.Patient || model<IPatient>('Patient', PatientSchema);

export default Patient;