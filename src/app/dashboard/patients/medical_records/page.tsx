// src/app/dashboard/patient/medical_records/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Record = {
  id: number
  doctor_id: number
  visit_date: string
  notes: string
  attachments: string[]
}
type Doctor   = { id: number; first_name: string; last_name: string }
type PatientMe = { id: number }

export default function MyMedicalRecordsPage() {
  const [recs,    setRecs]    = useState<Record[] | null>(null)
  const [doctors, setDoctors] = useState<Record<number,string>>({})
  const [error,   setError]   = useState<string|null>(null)

  /* — стили «glass & dark» — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const linkStyle  = "text-indigo-300 hover:text-indigo-100 underline transition-colors"

  /* ---------- загрузка данных ---------- */
  useEffect(() => {
    let pid = 0
    apiFetch<PatientMe>('/patients/me')
      .then(me => {
        pid = me.id
        return Promise.all([
          apiFetch<Doctor[]>('/doctors'),
          apiFetch<Record[]>(`/patients/${pid}/medical_records`),
        ])
      })
      .then(([docs, records]) => {
        const map: Record<number,string> = {}
        docs.forEach(d => (map[d.id] = `${d.first_name} ${d.last_name}`))
        setDoctors(map)
        setRecs(records)
      })
      .catch(e => setError(e.message))
  }, [])

  if (error)           return <p className="p-4 text-red-400">{error}</p>
  if (recs === null)   return <p className="p-4 text-gray-300">Загрузка…</p>
  if (recs.length === 0) return <p className="p-4 text-gray-300">У вас нет медкарт</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Мои медкарты
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="px-4 py-2">Дата визита</th>
                <th className="px-4 py-2">Врач</th>
                <th className="px-4 py-2">Заметки</th>
              </tr>
            </thead>
            <tbody>
              {recs.map(r => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="border-t border-white/20 hover:bg-white/5"
                >
                  <td className="px-4 py-2 align-top text-gray-200">
                    {new Date(r.visit_date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-2 align-top text-gray-200">
                    {doctors[r.doctor_id] || `#${r.doctor_id}`}
                  </td>
                  <td className="px-4 py-2 align-top whitespace-pre-wrap text-gray-200">
                    {r.notes}
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
