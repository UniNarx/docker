// src/app/dashboard/patients/medical_records/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Тип для информации о докторе, вложенной в MedicalRecordEntry
type EmbeddedDoctorInfo = {
  _id: string; // ID профиля доктора
  id?: string;
  firstName: string;
  lastName: string;
  specialty?: string; // Если специальность тоже приходит
};

// Обновленный тип MedicalRecordEntry
type MedicalRecordEntry = {
  _id: string;
  id?: number; // Если есть старый ID для ключа
  // doctorId: string; // Больше не нужен, если doctor - объект
  visitDate: string;
  notes: string;
  attachments?: string[];
  doctor: EmbeddedDoctorInfo; // Теперь это объект
};

// DoctorInfo для /doctors (если все еще нужен, например, для какой-то другой логики или если populate не всегда работает)
// type DoctorInfo = {
//   _id: string;
//   id?: number;
//   firstName: string;
//   lastName: string;
// };

type PatientProfileInfo = {
  id?: string;
  _id: string;
  user?: string | { username?: string; _id?: string };
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
};


export default function MyMedicalRecordsPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordEntry[] | null>(null);
  // doctorsMap больше не нужен, если информация о враче приходит с каждой медкартой
  // const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const patientProfile = await apiFetch<PatientProfileInfo>('/patients/me');
        const patientId = patientProfile?._id || patientProfile?.id;

        if (!patientId || typeof patientId !== 'string') {
          throw new Error("Не удалось получить валидный профиль пациента для загрузки медкарт.");
        }

        // Загружаем медкарты. Бэкенд должен популировать информацию о докторе.
        const recordsList = await apiFetch<MedicalRecordEntry[]>(`/patients/${patientId}/medical-records`);

        // Загрузка списка всех врачей и создание doctorsMap больше не нужны,
        // если информация о враче встроена в каждую медкарту.
        /*
        const doctorList = await apiFetch<DoctorInfo[]>('/doctors');
        const doctorsNameMap: Record<string, string> = {};
        doctorList.forEach(doc => {
          const docIdKey = doc._id || doc.id?.toString();
          if (docIdKey) {
            doctorsNameMap[docIdKey] = `${doc.firstName} ${doc.lastName}`;
          }
        });
        setDoctorsMap(doctorsNameMap);
        */

        setMedicalRecords(recordsList || []);
      } catch (err: any) {
        console.error("MyMedicalRecordsPage: Error during data fetching:", err);
        setError(err.message || "Произошла ошибка при загрузке медкарт.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <p className="p-4 text-center text-gray-300">Загрузка медицинских карт...</p>;
  }
  if (error) {
    return <p className="p-4 text-center text-red-400">Ошибка: {error}</p>;
  }
  if (!medicalRecords || medicalRecords.length === 0) {
    return <p className="p-4 text-center text-gray-300">У вас нет медицинских карт.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мои медкарты
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="px-4 py-2">Дата визита</th>
                <th className="px-4 py-2">Врач</th>
                <th className="px-4 py-2">Заметки</th>
              </tr>
            </thead>
            <tbody>
              {medicalRecords.map(record => {
                // Информация о враче теперь берется напрямую из record.doctor
                const doctorInfo = record.doctor;
                return (
                  <motion.tr
                    key={record._id || record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="border-t border-white/20 hover:bg-white/5"
                  >
                    <td className="px-4 py-2 align-top text-gray-200">
                      {new Date(record.visitDate).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-2 align-top text-gray-200">
                      {/* Используем поля из объекта doctorInfo */}
                      {doctorInfo ? `${doctorInfo.firstName} ${doctorInfo.lastName}` : 'Врач не указан'}
                    </td>
                    <td className="px-4 py-2 align-top whitespace-pre-wrap text-gray-200">
                      {record.notes}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}