// src/app/dashboard/doctors/appointments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Appointment = {
  id: number
  doctor_id: number
  patient_id: number
  appt_time: string
  status: string
}
type Patient = { id: number; first_name: string; last_name: string }
type Doctor  = { id: number; user_id: number; first_name: string; last_name: string }

export default function DoctorAppointmentsPage() {
  const [appts,    setAppts]    = useState<Appointment[]|null>(null)
  const [patients, setPatients] = useState<Record<number,string>>({})
  const [doctors,  setDoctors]  = useState<Record<number,string>>({})
  const [error,    setError]    = useState<string|null>(null)

  /* — common styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const rowHover    = "hover:bg-white/5 transition-colors"
  const btnCancel   = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white"
  const btnComplete = "px-3 py-1 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white"

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Не авторизованы')
      return
    }
    const { user_id, role_id } = JSON.parse(atob(token.split('.')[1]))
    if (role_id !== 2) {
      setError('Доступ только для врачей')
      return
    }

    Promise.all([
      apiFetch<Appointment[]>('/appointments'),
      apiFetch<Patient[]>('/patients'),
      apiFetch<Doctor[]>('/doctors'),
    ])
      .then(([all, pats, docs]) => {
        const pmap: Record<number,string> = {}
        pats.forEach(p => pmap[p.id] = `${p.first_name} ${p.last_name}`)
        const dmap: Record<number,string> = {}
        docs.forEach(d => dmap[d.id] = `${d.first_name} ${d.last_name}`)

        setPatients(pmap)
        setDoctors(dmap)

        const me = docs.find(d => d.user_id === user_id)
        if (!me) {
          setError('Профиль врача не найден')
          return
        }
        setAppts(all.filter(a => a.doctor_id === me.id))
      })
      .catch(e => setError(e.message))
  }, [])

  const cancel = async (id: number) => {
    if (!confirm('Отменить приём?')) return
    await apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH' })
    setAppts(prev => prev?.map(a => a.id === id ? { ...a, status: 'cancelled' } : a) || null)
  }

  const complete = async (id: number) => {
    if (!confirm('Отметить как завершённый?')) return
    await apiFetch(`/appointments/${id}/complete`, { method: 'PATCH' })
    setAppts(prev => prev?.map(a => a.id === id ? { ...a, status: 'completed' } : a) || null)
  }

  if (error)     return <p className="p-6 text-red-400">{error}</p>
  if (appts===null) return <p className="p-6 text-gray-300">Загрузка…</p>
  if (!appts.length) return <p className="p-6 text-gray-300">У вас нет приёмов</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <h1 className={`text-3xl font-bold mb-6 ${headerText}`}>
          Мои приёмы
        </h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['Дата / время','Пациент','Статус','Действия'].map(th => (
                  <th key={th} className="px-4 py-2">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.map(a => {
                const dt = new Date(a.appt_time)
                return (
                  <tr key={a.id} className={`border-t border-white/20 ${rowHover}`}>
                    <td className="px-4 py-3">
                      {dt.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">{patients[a.patient_id] || `#${a.patient_id}`}</td>
                    <td className="px-4 py-3 capitalize">{a.status}</td>
                    <td className="px-4 py-3 space-x-2">
                      {a.status === 'scheduled' && (
                        <>
                          <button onClick={() => cancel(a.id)} className={btnCancel}>
                            Отменить
                          </button>
                          <button onClick={() => complete(a.id)} className={btnComplete}>
                            Завершить
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
