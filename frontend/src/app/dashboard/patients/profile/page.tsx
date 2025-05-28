// src/app/dashboard/patients/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Типы для данных, получаемых от API
type ApiPatientData = {
  _id: string; // или id, если Mongoose его добавляет
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // Даты от API обычно приходят как ISO строки
  // ... другие поля, которые возвращает /api/patients/me
};

type ApiProfileData = {
  _id?: string; // или id
  id?: string;
  dob?: string;       // Даты от API обычно приходят как ISO строки
  gender?: string;
  // ... другие поля, которые возвращает /api/profiles/patient
};

// Локальные типы состояния, если они отличаются (здесь они могут совпадать)
// type LocalPatientState = { id: string; firstName: string; lastName: string; /* ... */ };
// type LocalProfileState = { id?: string; dob?: string; gender?: string; /* ... */ };


export default function PatientProfilePage() {
  /* ---------- state ---------- */
  // Используем any временно для patient и profile, чтобы избежать ошибок типизации при setPatient/setProfile,
  // пока не определены полные локальные типы. Лучше определить точные типы.
  const [patient, setPatient] = useState<ApiPatientData | null>(null);
  const [profile, setProfile] = useState<ApiProfileData>({}); // Может быть частичным

  const [fname, setFname]     = useState('');
  const [lname, setLname]     = useState('');
  const [dob,   setDob]       = useState('');   // YYYY-MM-DD для input type="date"
  const [gender,setGender]    = useState('');
  const [saving,setSaving]    = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Для индикации загрузки
  const [error, setError]     = useState<string|null>(null);

  /* ---------- загрузка ---------- */
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      apiFetch<ApiPatientData>('/patients/me'),
      apiFetch<ApiProfileData>('/profiles/patient').catch(() => ({} as ApiProfileData)), // Возвращаем пустой объект при ошибке
    ])
    .then(([patData, profData]) => {
      if (patData) {
        setPatient(patData);
        setFname(patData.firstName || '');
        setLname(patData.lastName || '');
        // Если dob в основном профиле пациента (/patients/me), а не в /profiles/patient
        // или если /profiles/patient не вернул dob
        if (patData.dateOfBirth && !profData.dob) {
          setDob(patData.dateOfBirth.slice(0, 10));
        }
      }
      if (profData) {
        setProfile(profData);
        if (profData.dob) { // Приоритет dob из /profiles/patient
          setDob(profData.dob.slice(0, 10));
        }
        setGender(profData.gender ?? '');
      }
    })
    .catch(e => {
      console.error("Ошибка загрузки данных профиля:", e);
      setError(e.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, []);

  /* ---------- сохранить ---------- */
  const save = async () => {
    if (!fname.trim() || !lname.trim()) { alert('Введите имя и фамилию'); return }
    if (!dob)            { alert('Укажите дату рождения'); return }
    // patient может быть null, если /patients/me не вернул данные, но мы должны были это обработать
    // if (!patient) return; // Эта проверка может быть не нужна, если мы сохраняем на /patients/me

    setSaving(true);
    setError(null);
    try {
      /* 1. Обновляем основные данные пациента (ФИО, дата рождения) */
      /* Бэкенд должен ожидать эти поля в camelCase */
      const updatedPatientData = await apiFetch<ApiPatientData>('/patients/me', { // Ожидаем обновленные данные
        method: 'PUT',
        body: JSON.stringify({
          firstName: fname,
          lastName: lname,
          dateOfBirth: dob, // Отправляем дату как YYYY-MM-DD строку
        }),
      });
      // Обновляем локальное состояние новыми данными, если нужно
      if (updatedPatientData) {
        setPatient(updatedPatientData);
        setFname(updatedPatientData.firstName || '');
        setLname(updatedPatientData.lastName || '');
        if (updatedPatientData.dateOfBirth) {
            setDob(updatedPatientData.dateOfBirth.slice(0,10));
        }
      }
      console.log("Основные данные пациента обновлены");

      /* 2. Обновляем/создаем доп. профиль (пол, возможно дубликат dob) */
      /* Бэкенд должен ожидать эти поля в camelCase */
      const updatedProfileData = await apiFetch<ApiProfileData>('/profiles/patient', {
        method: profile?.id || profile?._id ? 'PUT' : 'POST', // PUT если есть ID, иначе POST
        body: JSON.stringify({ dob, gender }), // Отправляем dob и gender
      });
      // Обновляем локальное состояние
      if (updatedProfileData) {
        setProfile(updatedProfileData);
        if (updatedProfileData.dob) {
            setDob(updatedProfileData.dob.slice(0,10));
        }
        setGender(updatedProfileData.gender ?? '');
      }
      console.log("Дополнительный профиль пациента обновлен/создан");

      alert('Профиль сохранён');
    } catch (e:any) {
      console.error("Ошибка сохранения профиля:", e);
      setError(e.message);
      alert(`Ошибка сохранения: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- UI ---------- */
  if (isLoading) return <p className="p-6 text-center text-gray-300">Загрузка профиля...</p>;
  if (error && !patient) return <p className="p-6 text-center text-red-400">Ошибка загрузки профиля: {error}</p>;
  // Если patient null после загрузки (например, /patients/me вернул 404), нужно дать пользователю возможность создать профиль.
  // Текущая логика save() предполагает, что /patients/me существует и его можно обновить.

    /* — стили — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  // const btnEdit     = "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400" // не используется
  const btnPwd      = "bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-md mx-auto ${glassCard} p-6 space-y-4 text-white !mt-20`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мой профиль
        </h1>

        {error && <p className="text-red-500 bg-red-900/20 p-2 rounded-md">Ошибка: {error}</p>}

        <label className="block space-y-1">
          <span className="font-medium">Имя</span>
          <input
            value={fname}
            onChange={e => setFname(e.target.value)}
            className={glassInput}
            placeholder="Ваше имя"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Фамилия</span>
          <input
            value={lname}
            onChange={e => setLname(e.target.value)}
            className={glassInput}
            placeholder="Ваша фамилия"
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Дата рождения</span>
          <input
            type="date"
            value={dob}
            onChange={e => setDob(e.target.value)}
            className={glassInput}
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Пол</span>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className={glassInput}
          >
            <option value="">— не выбрано —</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Другой</option> {/* Добавил other, если используется в Gender enum */}
          </select>
        </label>

        <button
          onClick={save}
          disabled={saving || isLoading} // Блокируем кнопку и во время начальной загрузки
          className={`${btnBase} ${btnSave}`}
        >
          {saving ? 'Сохраняем…' : (isLoading ? 'Загрузка...' : 'Сохранить')}
        </button>
        <Link href="/dashboard/patients/profile/password">
            <button className={`${btnBase} ${btnPwd}`} disabled={isLoading}>
              Сменить пароль
            </button>
          </Link>
      </motion.div>
    </div>
  )
}