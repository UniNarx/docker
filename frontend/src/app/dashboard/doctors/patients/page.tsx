// src/app/dashboard/doctors/patients/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES
} from '@/lib/authUtils'; // Предполагаем наличие этих утилит

// Тип для данных пациента, ожидаемых от API
type PatientData = {
  _id: string; // MongoDB ID
  id?: string;  // Mongoose virtual ID
  firstName: string; // было first_name
  lastName: string;  // было last_name
  dateOfBirth: string; // было date_of_birth (ожидаем строку даты)
  // user, createdAt и другие поля, если они нужны/приходят от API
};

// Тип для данных "я" (врача) от /doctors/me
type DoctorMeData = {
  _id: string; // MongoDB ID профиля врача
  id?: string;  // Mongoose virtual ID
  userId: string; // ID пользователя, связанного с этим профилем врача
  // firstName, lastName, specialty и другие поля, если они нужны/приходят от API
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientData[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* — glass & dark styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerBg    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"; // Для заголовка таблицы
  const rowHover    = "hover:bg-white/5 transition-colors";
  const btnView     = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-indigo-400 to-purple-400 text-white hover:from-purple-400 hover:to-indigo-400";

  useEffect(() => {
    setIsLoading(true);
    const token = getTokenFromStorage();
    if (!token) {
      setError('Не авторизованы');
      setIsLoading(false);
      return;
    }

    const decodedToken = getDecodedToken(token); // Получаем декодированный токен
    // Проверяем роль по имени роли
    if (!decodedToken || decodedToken.roleName !== ROLE_NAMES.DOCTOR) {
      setError('Доступ только для врачей');
      setIsLoading(false);
      return;
    }

    // Сначала получаем профиль текущего врача (/doctors/me), чтобы узнать его ID профиля врача
    apiFetch<DoctorMeData>('/doctors/me')
      .then(doctorProfile => {
        if (!doctorProfile || !(doctorProfile._id || doctorProfile.id)) {
          throw new Error('Не удалось получить профиль врача.');
        }
        const currentDoctorProfileId = doctorProfile._id || doctorProfile.id;
        // Затем запрашиваем пациентов этого врача
        return apiFetch<PatientData[]>(`/doctors/${currentDoctorProfileId}/patients`);
      })
      .then(patientList => {
        setPatients(patientList || []); // Устанавливаем пустой массив, если null
      })
      .catch(e => {
        console.error("Ошибка загрузки пациентов врача:", e);
        setError(e.message || "Произошла ошибка при загрузке данных.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка списка пациентов...</p>;
  if (error) return <p className="p-6 text-center text-red-400">{error}</p>;
  // Условие "!patients.length" уже обрабатывается ниже, если patients не null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мои пациенты
        </h1>

        {patients === null || patients.length === 0 && !isLoading && ( // Показываем если null или пустой массив и не загрузка
            <p className="p-6 text-center text-gray-300">У вас нет пациентов.</p>
        )}

        {patients && patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
              <thead>
                <tr className={`${headerBg}`}>
                  {['ID', 'Имя', 'Фамилия', 'Дата рождения', 'Действие'].map(col => (
                    <th key={col} className="px-4 py-2 font-medium text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, i) => {
                  const patientId = patient._id || patient.id; // ID пациента для ключа и ссылки
                  return (
                    <motion.tr
                      key={patientId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-t border-white/20 ${rowHover}`}
                    >
                      <td className="px-4 py-3 text-gray-200 truncate max-w-[100px]">{patientId}</td>
                      <td className="px-4 py-3 text-gray-200">{patient.firstName}</td> {/* было first_name */}
                      <td className="px-4 py-3 text-gray-200">{patient.lastName}</td>  {/* было last_name */}
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(patient.dateOfBirth).toLocaleDateString('ru-RU')} {/* было date_of_birth */}
                      </td>
                      <td className="px-4 py-3">
                        {patientId && (
                          <Link href={`/dashboard/doctors/patients/${patientId}`}>
                            <button className={btnView}>
                              Смотреть
                            </button>
                          </Link>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}