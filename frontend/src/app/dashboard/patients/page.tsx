// src/app/dashboard/patients/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link' // Link не используется в текущем коде, но может понадобиться для кнопки "Ред."
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Тип для данных пациента, ожидаемых от API
type PatientData = {
  id?: string;           // Виртуальный ID от Mongoose (строка)
  _id: string;          // Основной ID от MongoDB (строка)
  firstName: string;    // было first_name
  lastName: string;     // было last_name
  dateOfBirth: string;  // было date_of_birth, приходит как строка даты (YYYY-MM-DD или ISO)
  createdAt: string;    // было created_at, приходит как строка ISO даты
  user?: {              // Если API возвращает информацию о пользователе
    _id: string;
    username: string;
  };
  // ... другие поля, если API их возвращает
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]); // Инициализируем пустым массивом
  const [error, setError]       = useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* — общие стили — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  // const btnAdd      = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white"; // Не используется
  // const btnEdit     = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white"; // Не используется
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white";
  const rowHover    = "hover:bg-white/5 transition-colors";

  useEffect(() => {
    setIsLoading(true);
    apiFetch<PatientData[]>('/patients') // Ожидаем PatientData[]
      .then(data => {
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Ошибка загрузки списка пациентов:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Удалить пациента? Это действие необратимо.')) return;
    try {
      await apiFetch<void>(`/patients/${patientId}`, { method: 'DELETE' });
      setPatients(prevPatients => prevPatients.filter(p => (p._id || p.id) !== patientId));
      // alert('Пациент успешно удален'); // Опционально
    } catch (e: any) {
      console.error(`Ошибка удаления пациента ${patientId}:`, e);
      alert('Ошибка при удалении пациента: ' + e.message);
    }
  };

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка списка пациентов...</p>;
  if (error) return <p className="p-6 text-center text-red-400">Ошибка: {error}</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6`} // Увеличил max-w для таблицы
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${headerText}`}>Пациенты</h1>
          {/* Кнопка "Добавить пациента" отсутствует в вашем коде, если нужна - можно добавить Link сюда */}
          {/* <Link href="/dashboard/patients/create">
            <button className={btnAdd}>Добавить пациента</button>
          </Link> */}
        </div>

        {patients.length === 0 && !isLoading && (
           <p className="text-center text-gray-400 py-4">Пациенты не найдены.</p>
        )}

        {patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
              <thead className="text-left text-gray-300">
                <tr> {/* Заголовки таблицы должны быть в tr */}
                  {['ID', 'Имя', 'Фамилия', 'ДР', 'Создано', 'Действия'].map(col => (
                    <th key={col} className="px-4 py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => {
                  const patientId = p._id || p.id; // Используем _id или id
                  return (
                    <motion.tr
                      key={patientId} // Ключ должен быть уникальным
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-t border-white/20 ${rowHover}`}
                    >
                      <td className="px-4 py-3 text-gray-200 truncate max-w-[100px]">{patientId}</td>
                      <td className="px-4 py-3 text-gray-200">{p.firstName}</td>    {/* было first_name */}
                      <td className="px-4 py-3 text-gray-200">{p.lastName}</td>     {/* было last_name */}
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(p.dateOfBirth).toLocaleDateString('ru-RU')} {/* было date_of_birth */}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(p.createdAt).toLocaleString('ru-RU', { /* было created_at */
                          dateStyle: 'short', timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {/* Если нужна кнопка редактирования:
                        <Link href={`/dashboard/patients/${patientId}/edit`}>
                          <button className={btnEdit}>Ред.</button>
                        </Link>
                        */}
                        <button
                          className={btnDelete}
                          onClick={() => patientId && handleDeletePatient(patientId)}
                          disabled={!patientId}
                        >
                          Удл.
                        </button>
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