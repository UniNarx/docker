// src/app/dashboard/patient/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'


type Patient = { id:number; first_name:string; last_name:string }
type Profile = { id?:number; dob?:string; gender?:string }

export default function PatientProfilePage() {
  /* ---------- state ---------- */
  const [patient, setPatient] = useState<Patient|null>(null)
  const [profile, setProfile] = useState<Profile>({})
  const [fname, setFname]     = useState('')   // first_name
  const [lname, setLname]     = useState('')   // last_name
  const [dob,   setDob]       = useState('')   // YYYY-MM-DD
  const [gender,setGender]    = useState('')
  const [saving,setSaving]    = useState(false)
  const [error, setError]     = useState<string|null>(null)

  /* ---------- загрузка ---------- */
  useEffect(() => {
    // параллельно тянем ФИО и профиль
Promise.all([
  apiFetch<Patient>('/patients/me'),
  apiFetch<Profile>('/profiles/patient').catch(() => ({} as Profile)),
])
.then(([pat, prof]) => {
  setPatient(pat)
  setFname(pat.first_name)
  setLname(pat.last_name)
  setProfile(prof)
setDob(prof.dob ? prof.dob.slice(0, 10) : '');
  setGender(prof.gender ?? '')
})


    .catch(e => setError(e.message))
  }, [])

  /* ---------- сохранить ---------- */
  const save = async () => {
    if (!fname || !lname) { alert('Введите имя и фамилию'); return }
    if (!dob)            { alert('Укажите дату рождения'); return }
    if (!patient) return
    setSaving(true)
    try {
      /* 1. ФИО в таблице patients */
     await apiFetch('/patients/me', {
  method: 'PUT',
  body: JSON.stringify({ first_name: fname, last_name: lname,
    date_of_birth  : dob,   }),
})

      /* 2. DOB + gender в patient_profiles */
      await apiFetch('/profiles/patient', {
        method: profile.id ? 'PUT' : 'POST',
        body: JSON.stringify({ dob, gender }),
      })
      alert('Профиль сохранён')
    } catch (e:any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ---------- UI ---------- */
  if (error) return <p className="p-6 text-red-600">Ошибка: {error}</p>
  if (!patient) return <p className="p-6">Загрузка…</p>

    /* — стили — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const btnEdit     = "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400"
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

        <label className="block space-y-1">
          <span className="font-medium">Имя</span>
          <input
            value={fname}
            onChange={e => setFname(e.target.value)}
            className={glassInput}
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Фамилия</span>
          <input
            value={lname}
            onChange={e => setLname(e.target.value)}
            className={glassInput}
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
          </select>
        </label>

        <button
          onClick={save}
          disabled={saving}
          className={`${btnBase} ${btnSave}`}
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <Link href="/dashboard/patients/profile/password">
            <button className={`${btnBase} ${btnPwd}`}>
              Сменить пароль
            </button>
          </Link>
      </motion.div>
    </div>
  )
}
