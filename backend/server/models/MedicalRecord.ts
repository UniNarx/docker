// server/models/MedicalRecord.ts
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IPatient } from './Patient';
import { IDoctor } from './Doctor';

export interface IMedicalRecord extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  patient: Types.ObjectId | IPatient; // Ссылка на профиль пациента
  doctor: Types.ObjectId | IDoctor;   // Ссылка на профиль врача, который сделал запись
  visitDate: Date;                    // Дата визита
  notes?: string;                     // Заметки врача, диагноз, назначения (опционально)
  attachments?: string[];             // Массив ссылок на прикрепленные файлы (опционально)
  // createdAt и updatedAt будут добавлены через timestamps
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient', // Ссылка на модель Patient (профиль пациента)
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor', // Ссылка на модель Doctor (профиль врача)
      required: true, // Врач, сделавший запись
    },
    visitDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: { // Массив строк (например, URL или пути к файлам)
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Добавляет createdAt и updatedAt
  }
);

// Индексы для частого поиска
MedicalRecordSchema.index({ patient: 1, visitDate: -1 }); // Записи пациента, отсортированные по дате убывания
MedicalRecordSchema.index({ doctor: 1, visitDate: -1 });  // Записи врача

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord || model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);

export default MedicalRecord;