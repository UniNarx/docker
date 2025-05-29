// src/app/dashboard/doctors/profile/page.tsx
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Для отображения аватара
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';

// Обновленный тип для данных врача
type DoctorProfileData = { // Переименовал из Doctor для ясности и консистентности
  _id: string; // ID профиля врача (Doctor._id)
  id?: string;  // Виртуальный ID от Mongoose
  userId?: string; // ID пользователя (User._id), если бэкенд его возвращает с /doctors/me
  firstName: string; // было first_name
  lastName: string;  // было last_name
  specialty: string;
  avatarUrl?: string;
  description?: string;
  // createdAt, updatedAt, если нужны
};

export default function DoctorProfilePage() {
  const [doctorData, setDoctorData] = useState<DoctorProfileData | null>(null); // было doc, setDoc
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Добавил состояние загрузки
  const router = useRouter();

  /* — common glass styles (остаются) — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const btnBase    = "px-4 py-2 rounded-lg font-medium transition-colors text-white";
  const btnPwd     = "bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500";
  const btnEdit    = "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400";

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    apiFetch<DoctorProfileData>('/doctors/me') // Ожидаем DoctorProfileData
      .then(data => {
        if (!data) throw new Error("Не удалось загрузить профиль врача.");
        setDoctorData(data);
      })
      .catch(e => {
        console.error("Ошибка загрузки профиля врача:", e);
        if (e.message.includes('401') || e.message.includes('Не авторизован')) {
          alert('Сессия истекла или вы не авторизованы. Войдите снова.');
          localStorage.removeItem('token'); // Используйте authUtils, если есть
          window.dispatchEvent(new Event('token-changed'));
          router.push('/public/login');
        } else {
          setError(e.message || "Произошла ошибка.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]); // Добавил router в зависимости, хотя для /doctors/me это может быть не критично

  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка профиля...</p>;
  if (error) return <p className="p-6 text-center text-red-400">Ошибка: {error}</p>;
  if (!doctorData) return <p className="p-6 text-center text-gray-300">Профиль врача не найден.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-lg w-full ${glassCard} p-8 space-y-6 text-white`} // Увеличил padding
      >
        {/* Секция с аватаром */}
        <div className="flex flex-col items-center">
          {doctorData.avatarUrl ? (
            <Image
              src={doctorData.avatarUrl}
              alt={`Аватар ${doctorData.firstName} ${doctorData.lastName}`}
              width={128} // 8rem
              height={128} // 8rem
              className="rounded-full object-cover w-32 h-32 border-4 border-indigo-500 shadow-xl"
              priority // Если это главный имидж на странице
              onError={() => { console.warn("Не удалось загрузить аватар:", doctorData.avatarUrl); /* Можно установить fallback */ }}
            />
          ) : (
            <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-5xl border-4 border-gray-600">
              {doctorData.firstName?.charAt(0).toUpperCase()}
              {doctorData.lastName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="text-center">
            <h1 className={`text-3xl font-bold ${headerText}`}>
            {doctorData.firstName} {doctorData.lastName} {/* Используем camelCase */}
            </h1>
            <p className="text-indigo-300 mt-1">
            {doctorData.specialty}
            </p>
        </div>

        {/* Описание врача */}
        {doctorData.description && (
          <div className="pt-4 border-t border-white/10">
            <h2 className="text-lg font-semibold text-indigo-200 mb-2">Обо мне:</h2>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {doctorData.description}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
          
          <Link href="/dashboard/doctors/profile/password" className="w-full ">
            <button className={`${btnBase} ${btnPwd} w-full`}> {/* Сделал кнопку на всю ширину */}
              Сменить пароль
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}