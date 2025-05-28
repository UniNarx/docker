// server/models/Appointment.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IDoctor } from './Doctor';
import { IPatient } from './Patient';

// Возможные статусы записи на прием
export enum AppointmentStatus {
  SCHEDULED = 'scheduled', // Запланирована
  COMPLETED = 'completed', // Завершена
  CANCELLED = 'cancelled', // Отменена
  // Можно добавить другие статусы, если необходимо (e.g., NO_SHOW, RESCHEDULED)
}

export interface IAppointment extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  doctor: Types.ObjectId | IDoctor;    // Ссылка на профиль врача (Doctor ID)
  patient: Types.ObjectId | IPatient;  // Ссылка на профиль пациента (Patient ID)
  apptTime: Date;                      // Дата и время приема
  status: AppointmentStatus;           // Статус записи
  // createdAt и updatedAt будут добавлены через timestamps
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor', // Ссылка на модель Doctor (профиль врача)
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient', // Ссылка на модель Patient (профиль пациента)
      required: true,
    },
    apptTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus), // Разрешенные значения из enum
      default: AppointmentStatus.SCHEDULED,   // Статус по умолчанию
      required: true,
    },
  },
  {
    timestamps: true, // Добавляет createdAt и updatedAt
  }
);

// Индекс для ускорения поиска записей по врачу и дате
AppointmentSchema.index({ doctor: 1, apptTime: 1 });
// Индекс для поиска записей по пациенту
AppointmentSchema.index({ patient: 1, apptTime: 1 });


const Appointment: Model<IAppointment> = 
  mongoose.models.Appointment || model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;