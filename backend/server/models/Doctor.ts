// server/models/Doctor.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';
// import { IPatient } from './Patient'; // Для типа, если популируем

export interface IDoctor extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  firstName: string;
  lastName: string;
  specialty: string;
  assignedPatients?: (Types.ObjectId)[]; // Массив ID профилей пациентов
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, "Имя врача обязательно"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Фамилия врача обязательна"],
      trim: true,
    },
    specialty: {
      type: String,
      required: [true, "Специализация врача обязательна"],
      trim: true,
    },
    assignedPatients: [{ // Массив ссылок на профили пациентов (Patient)
      type: Schema.Types.ObjectId,
      ref: 'Patient',
    }],
  },
  {
    timestamps: true,
  }
);

const Doctor: Model<IDoctor> = mongoose.models.Doctor || model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;