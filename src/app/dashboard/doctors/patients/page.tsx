// src/app/dashboard/patient/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Patient = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
}
type DoctorMe = { id: number }

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[] | null>(null)
  const [error,    setError   ] = useState<string | null>(null)

  /* — glass & dark styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerBg    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
  const rowHover    = "hover:bg-white/5"
  const btnView     = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-indigo-400 to-purple-400 text-white hover:from-purple-400 hover:to-indigo-400"

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setError('Не авторизованы'); return }
    const { role_id } = JSON.parse(atob(token.split('.')[1]))
    if (role_id < 2) { setError('Доступ только для врачей'); return }

    apiFetch<DoctorMe>('/doctors/me')
      .then(me => apiFetch<Patient[]>(`/doctors/${me.id}/patients`))
      .then(list => setPatients(list))
      .catch(e => setError(e.message))
  }, [])

  if (error)             return <p className="p-6 text-red-400">{error}</p>
  if (patients === null) return <p className="p-6 text-gray-300">Загрузка…</p>
  if (!patients.length)  return <p className="p-6 text-gray-300">У вас нет пациентов</p>

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

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className={`${headerBg}`}>
                {['ID','Имя','Фамилия','Дата рождения','Действие'].map(col => (
                  <th key={col} className="px-4 py-2 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-t border-white/20 ${rowHover}`}
                >
                  <td className="px-4 py-3 text-gray-200">{p.id}</td>
                  <td className="px-4 py-3 text-gray-200">{p.first_name}</td>
                  <td className="px-4 py-3 text-gray-200">{p.last_name}</td>
                  <td className="px-4 py-3 text-gray-200">
                    {new Date(p.date_of_birth).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/doctors/patients/${p.id}`}>
                      <button className={btnView}>
                        Смотреть
                      </button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
