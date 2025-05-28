// src/app/dashboard/appointments/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

// Тип для данных записи на прием от API
type AppointmentData = {
  _id: string;         // MongoDB ID
  id?: string;          // Mongoose virtual ID
  doctorId: string;    // было doctor_id, теперь ID профиля врача (строка)
  patientId: string;   // было patient_id, теперь ID профиля пациента (строка)
  apptTime: string;    // было appt_time (ISO строка)
  status?: string;      // Статус, если приходит от API
};

// Тип для опций в выпадающих списках (врачи, пациенты)
type SelectOption = {
  value: string; // ID (строка)
  label: string; // Имя для отображения
};

// Типы для данных, приходящих от /doctors и /patients API
type ApiDoctorInfo = {
  _id: string;
  id?: string;
  firstName: string; // было first_name
  lastName: string;  // было last_name
};

type ApiPatientInfo = {
  _id: string;
  id?: string;
  firstName: string; // было first_name
  lastName: string;  // было last_name
};


export default function EditAppointmentPage() {
  const params = useParams();
  // apptIdParam уже строка, т.к. useParams возвращает строки для сегментов URL
  const apptIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [doctorOptions, setDoctorOptions]   = useState<SelectOption[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null); // Храним всю запись

  // Состояния для полей формы - ID теперь строки
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [appointmentTime, setAppointmentTime]   = useState(''); // Формат YYYY-MM-DDTHH:mm для datetime-local

  const [error, setError]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]     = useState(false);

  /* — стили glassmorphism (остаются) — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";
  const linkCancel = "mt-4 text-center text-indigo-300 hover:underline";

  useEffect(() => {
    if (!apptIdParam) {
      setError("ID записи на приём не найден в URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    Promise.all([
      apiFetch<AppointmentData>(`/appointments/${apptIdParam}`), // Загружаем конкретную запись
      apiFetch<ApiDoctorInfo[]>('/doctors'),      // Загружаем список врачей для <select>
      apiFetch<ApiPatientInfo[]>('/patients'),    // Загружаем список пациентов для <select>
    ])
      .then(([appt, doctorsList, patientsList]) => {
        if (!appt) throw new Error("Запись на приём не найдена.");
        setAppointmentData(appt);
        setSelectedDoctorId(appt.doctorId); // doctorId должен быть строкой
        setSelectedPatientId(appt.patientId); // patientId должен быть строкой

        // Преобразование ISO строки appt.apptTime в формат для datetime-local (YYYY-MM-DDTHH:mm)
        const dt = new Date(appt.apptTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setAppointmentTime(
          `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
        );

        setDoctorOptions(doctorsList.map(d => ({
            value: d._id || d.id || '', // ID врача (строка)
            label: `${d.firstName} ${d.lastName}` // было first_name, last_name
        })).filter(opt => opt.value)); // Фильтруем пустые value на всякий случай

        setPatientOptions(patientsList.map(p => ({
            value: p._id || p.id || '', // ID пациента (строка)
            label: `${p.firstName} ${p.lastName}` // было first_name, last_name
        })).filter(opt => opt.value));
      })
      .catch(e => {
        console.error("Ошибка загрузки данных для редактирования записи:", e);
        setError(e.message || "Не удалось загрузить данные.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [apptIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptIdParam || !selectedDoctorId || !selectedPatientId || !appointmentTime) {
        setError("Все поля должны быть заполнены.");
        return;
    }
    setIsSaving(true);
    setError(null);

    // Преобразуем время из datetime-local в ISO строку для отправки на бэкенд
    const isoApptTime = new Date(appointmentTime).toISOString();

    try {
      // Отправляем PUT запрос на /api/appointments/:id (ID из URL)
      // Бэкенд должен ожидать doctorId, patientId, apptTime в camelCase
      await apiFetch<void>(`/appointments/${apptIdParam}`, { // ID записи в URL
        method: 'PUT',
        body: JSON.stringify({
          // ID самой записи (apptIdParam) обычно не передается в теле PUT, т.к. он в URL
          doctorId: selectedDoctorId,    // было doctor_id
          patientId: selectedPatientId,  // было patient_id
          apptTime: isoApptTime,       // было appt_time
          // Можно также передавать status, если он редактируется здесь
          // status: appointmentData?.status || 'scheduled'
        }),
      });
      alert('Запись на приём успешно обновлена!');
      router.push('/dashboard/appointments'); // Перенаправляем на список записей
    } catch (err: any) {
      console.error("Ошибка сохранения записи:", err);
      setError(err.message || "Не удалось сохранить изменения.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="p-4 text-center text-gray-300">Загрузка данных записи...</p>;
  if (error) return <p className="p-4 text-center text-red-400">Ошибка: {error}</p>;
  if (!appointmentData) return <p className="p-4 text-center text-gray-300">Данные записи не найдены.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Редактировать приём #{apptIdParam}
        </h1>

        {error && <p className="text-red-500 bg-red-900/20 p-2 rounded-md text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Доктор</span>
            <select
              className={glassInput}
              value={selectedDoctorId} // value теперь строка
              onChange={e => setSelectedDoctorId(e.target.value)} // e.target.value уже строка
              required
            >
              <option value="">— выберите доктора —</option>
              {doctorOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Пациент</span>
            <select
              className={glassInput}
              value={selectedPatientId} // value теперь строка
              onChange={e => setSelectedPatientId(e.target.value)} // e.target.value уже строка
              required
            >
              <option value="">— выберите пациента —</option>
              {patientOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Дата и время</span>
            <input
              type="datetime-local"
              className={glassInput}
              value={appointmentTime}
              onChange={e => setAppointmentTime(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || isLoading}
            className={`${btnBase} ${btnSave}`}
          >
            {isSaving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>

        <button 
            onClick={() => router.back()} 
            className={`${linkCancel} w-full py-2`} // Сделал похожим на кнопку для консистентности
            disabled={isSaving || isLoading}
        >
          Отмена
        </button>
      </motion.div>
    </div>
  );
}