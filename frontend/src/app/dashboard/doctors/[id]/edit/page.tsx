// src/app/dashboard/doctors/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Тип для данных врача, ожидаемых от API
type DoctorData = {
  id?: string; // Может быть виртуальным id от Mongoose
  _id: string;  // Основной ID от MongoDB
  firstName: string;
  lastName: string;
  specialty: string;
  // Можно добавить user, createdAt, updatedAt, если они нужны или приходят от API
}

export default function DoctorEditPage() {
  const router = useRouter();
  const params = useParams(); // useParams возвращает объект, id может быть строкой или string[]
  const doctorIdParam = Array.isArray(params.id) ? params.id[0] : params.id; // Берем первый элемент, если массив

  const [doctorData, setDoctorData] = useState<DoctorData | null>(null); // Храним полные данные врача
  const [error, setError]           = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true); // Состояние загрузки
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [specialty, setSpecialty]   = useState('');
  const [saving, setSaving]         = useState(false);

  /* — glass & dark styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors";
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";

  /* — загрузка доктора — */
  useEffect(() => {
    if (!doctorIdParam) {
      setError("ID врача не найден в URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Запрашиваем конкретного врача по ID, а не весь список
    apiFetch<DoctorData>(`/doctors/${doctorIdParam}`)
      .then(data => {
        if (data) {
          setDoctorData(data);
          setFirstName(data.firstName); // было d.first_name
          setLastName(data.lastName);   // было d.last_name
          setSpecialty(data.specialty);
        } else {
          throw new Error("Врач не найден.");
        }
      })
      .catch(err => {
        console.error(`Ошибка загрузки врача с ID ${doctorIdParam}:`, err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [doctorIdParam]); // Зависимость от ID врача из URL

  /* — сохранение — */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !specialty.trim()) {
      setError("Имя, фамилия и специализация обязательны.");
      return;
    }
    if (!doctorData || !doctorIdParam) {
        setError("Данные врача не загружены или ID врача отсутствует.");
        return;
    }

    setSaving(true);
    setError(null);
    try {
      // Отправляем PUT запрос на /api/doctors/:id для обновления конкретного врача
      // Бэкенд должен ожидать поля в camelCase.
      // Передаем только изменяемые поля, ID уже в URL.
      await apiFetch<void>(`/doctors/${doctorIdParam}`, { // Используем ID из URL
        method: 'PUT',
        body: JSON.stringify({
          // ID обычно не передается в теле PUT запроса, если он есть в URL
          // Если ваш бэкенд требует ID в теле, раскомментируйте:
          // id: doctorIdParam, // или doctorData._id
          firstName: firstName, // было first_name
          lastName: lastName,   // было last_name
          specialty,
        }),
      });
      router.push('/dashboard/doctors');
    } catch (err: any) {
      console.error("Ошибка сохранения данных врача:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка данных врача...</p>;
  if (error) return <p className="p-6 text-center text-red-400">Ошибка: {error}</p>;
  if (!doctorData) return <p className="p-6 text-center text-gray-300">Данные врача не найдены.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          {/* Используем _id или id для отображения, если нужно */}
          Редактировать врача #{doctorData._id || doctorData.id}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Имя</span>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Фамилия</span>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Специализация</span>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving || isLoading}
            className={`${btnBase} ${btnSave}`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}