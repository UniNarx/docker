// src/app/dashboard/appointments/page.tsx
'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES,
    RoleName,
    DecodedJwtPayload
} from '@/lib/authUtils'; // Предполагаем наличие

// Обновленные типы
type AppointmentData = {
  _id: string;
  id?: string;
  doctorId: string; // ID профиля врача (строка)
  patientId: string; // ID профиля пациента (строка)
  apptTime: string;  // было appt_time
  createdAt?: string; // было created_at
  status: string; // Добавим статус, он важен для отображения
  doctor?: { // Если бэкенд популирует для /api/appointments (для админа)
    _id: string;
    firstName: string;
    lastName: string;
  };
  patient?: { // Если бэкенд популирует для /api/appointments (для админа)
    _id: string;
    firstName: string;
    lastName: string;
  };
};

type DoctorProfileData = {
  _id: string;
  id?: string;
  userId: string;    // было user_id
  firstName: string; // было first_name
  lastName: string;  // было last_name
};

type PatientProfileData = {
  _id: string;
  id?: string;
  userId: string;    // было user_id
  firstName: string; // было first_name
  lastName: string;  // было last_name
};

type NameMap = Record<string, string>; // ID (string) -> Имя (string)

export default function AdminAppointmentsPage() { // Переименовано для ясности
  const [appointments, setAppointments] = useState<AppointmentData[] | null>(null);
  const [doctorsMap, setDoctorsMap]     = useState<NameMap>({});
  const [patientsMap, setPatientsMap]   = useState<NameMap>({});
  const [error, setError]               = useState<string | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<RoleName>(null);

  /* — common styles (остаются) — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const btnAdd      = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white";
  const btnEdit     = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white";
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white";
  const rowHover    = "hover:bg-white/5 transition-colors";

  useEffect(() => {
    setIsLoading(true);
    const token = getTokenFromStorage();
    const decodedToken = getDecodedToken(token);
    const role = decodedToken?.roleName as RoleName || ROLE_NAMES.ANONYMOUS;
    setCurrentUserRole(role);

    // Эта страница должна быть доступна только админам/суперадминам
    if (role !== ROLE_NAMES.ADMIN && role !== ROLE_NAMES.SUPERADMIN) {
      setError("Доступ запрещен. Эта страница только для администраторов.");
      setIsLoading(false);
      return;
    }

    // Администратор загружает ВСЕ данные
    // Убедитесь, что GET /api/appointments возвращает ВСЕ записи и популирует doctor и patient
    Promise.all([
      apiFetch<DoctorProfileData[]>('/doctors'),
      apiFetch<PatientProfileData[]>('/patients'),
      apiFetch<AppointmentData[]>('/appointments/all-for-admin'), // НУЖЕН НОВЫЙ ЭНДПОИНТ!
    ])
      .then(([doctorList, patientList, appointmentList]) => {
        const dMap: NameMap = {};
        doctorList.forEach(d => {
            const docIdKey = d._id || d.id;
            if (docIdKey) dMap[docIdKey] = `${d.firstName} ${d.lastName}`;
        });
        const pMap: NameMap = {};
        patientList.forEach(p => {
            const patIdKey = p._id || p.id;
            if (patIdKey) pMap[patIdKey] = `${p.firstName} ${p.lastName}`;
        });
        setDoctorsMap(dMap);
        setPatientsMap(pMap);
        setAppointments(appointmentList || []);
      })
      .catch(err => {
        console.error("Ошибка загрузки данных для страницы Приёмы (Админ):", err);
        setError(err.message || "Произошла ошибка");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Удалить эту запись на приём?')) return;
    try {
      await apiFetch<void>(`/appointments/${appointmentId}`, { method: 'DELETE' });
      setAppointments(prev => prev?.filter(a => (a._id || a.id) !== appointmentId) || null);
      alert('Запись на приём удалена.');
    } catch (e: any) {
      alert('Ошибка удаления: ' + e.message);
    }
  };


  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка списка приёмов...</p>;
  if (error) return <p className="p-6 text-center text-red-400">{error}</p>;
  if (!appointments) return <p className="p-6 text-center text-gray-300">Не удалось загрузить данные о приёмах.</p>; // На случай если appointments остался null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-5xl mx-auto ${glassCard} p-6`} // Увеличил max-w
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${headerText}`}>Управление Приёмами</h1>
          <Link href="/dashboard/appointments/create">
            <button className={btnAdd}>Добавить приём</button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead className="text-left text-gray-300">
              <tr>
                {['ID Записи', 'Доктор', 'Пациент', 'Время', 'Статус', 'Действия'].map(col => (
                  <th key={col} className="px-4 py-2">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">
                    Нет приёмов для отображения.
                  </td>
                </tr>
              ) : (
                appointments.map(appt => {
                  const apptId = appt._id || appt.id;
                  const doctorName = appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : (doctorsMap[appt.doctorId] || `#${appt.doctorId}`);
                  const patientName = appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : (patientsMap[appt.patientId] || `#${appt.patientId}`);
                  return (
                    <tr key={apptId} className={`border-t border-white/20 ${rowHover}`}>
                      <td className="px-4 py-3 text-gray-200 truncate max-w-[100px]">{apptId}</td>
                      <td className="px-4 py-3 text-gray-200">{doctorName}</td>
                      <td className="px-4 py-3 text-gray-200">{patientName}</td>
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(appt.apptTime).toLocaleString('ru-RU', { /* было appt_time */
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-200 capitalize">{appt.status}</td>
                      <td className="px-4 py-3 space-x-2">
                        {apptId && (
                           <Link href={`/dashboard/appointments/${apptId}/edit`}>
                             <button className={btnEdit}>Ред.</button>
                           </Link>
                        )}
                        {apptId && (
                            <button
                                className={btnDelete}
                                onClick={() => handleDeleteAppointment(apptId)}
                            >
                                Удл.
                            </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}