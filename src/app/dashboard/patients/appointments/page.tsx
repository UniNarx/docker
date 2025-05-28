// src/app/public/appointments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Appt    = { id: number; doctor_id: number; appt_time: string; status: string }
type Doctor  = { id: number; first_name: string; last_name: string; specialty: string }
type Profile = { id: number }

export default function MyAppointmentsPage() {
  const [appts,  setAppts]  = useState<Appt[] | null>(null)
  const [doctorsMap, setDoctorsMap] = useState<Record<number, Doctor>>({})
  const [error,  setError]  = useState<string | null>(null)

  /* glass & theme styles */
  const glassCard = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const btnCancel = "px-3 py-1 text-sm rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"

  /* fetch data */
  useEffect(() => {
    apiFetch<{ id: number }>('/patients/me')
      .then(p =>
        Promise.all([
          apiFetch<Appt[]>(`/patients/${p.id}/appointments`),
          apiFetch<Doctor[]>('/doctors'),
        ]),
      )
      .then(([alist, dlist]) => {
        const map: Record<number, Doctor> = {}
        dlist.forEach(d => { map[d.id] = d })
        setDoctorsMap(map)
        setAppts(alist)
      })
      .catch(e => setError(e.message))
  }, [])

  const cancel = async (id: number) => {
    if (!confirm('Отменить запись?')) return
    try {
      await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
      setAppts(prev =>
        prev!.map(a =>
          a.id === id ? { ...a, status: 'cancelled' } : a
        )
      )
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (error)           return <p className="p-4 text-red-400">{error}</p>
  if (appts === null)   return <p className="p-4 text-gray-200">Загрузка…</p>
  if (appts.length === 0) return <p className="p-4 text-gray-200">У вас ещё нет приёмов</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-5xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мои приёмы
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['Дата／Время','Доктор','Специализация','Статус'].map(title => (
                  <th key={title} className="px-4 py-2">{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.map(a => {
                const dt = new Date(a.appt_time)
                const doc = doctorsMap[a.doctor_id]
               
                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="border-t border-white/20 hover:bg-white/5"
                  >
                    <td className="px-4 py-2">
                      {dt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-2">
                      {doc ? `${doc.first_name} ${doc.last_name}` : `#${a.doctor_id}`}
                    </td>
                    <td className="px-4 py-2">{doc?.specialty || '–'}</td>
                    <td className="px-4 py-2 capitalize">{a.status}</td>
                   
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
