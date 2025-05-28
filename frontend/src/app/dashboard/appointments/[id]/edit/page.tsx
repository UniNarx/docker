// src/app/dashboard/appointments/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Appointment = {
  id: number
  doctor_id: number
  patient_id: number
  appt_time: string
}
type Option = { id: number; label: string }

export default function EditAppointmentPage() {
  const { id } = useParams()
  const apptId = Number(id)
  const router = useRouter()

  const [doctors,   setDoctors]   = useState<Option[]>([])
  const [patients,  setPatients]  = useState<Option[]>([])
  const [data,      setData]      = useState<Appointment|null>(null)
  const [doctorId,  setDoctorId]  = useState<number>()
  const [patientId, setPatientId] = useState<number>()
  const [apptTime,  setApptTime]  = useState('')
  const [error,     setError]     = useState<string|null>(null)
  const [saving,    setSaving]    = useState(false)

  /* — стили glassmorphism — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const linkCancel = "mt-4 text-center text-indigo-300 hover:underline"

  useEffect(() => {
    Promise.all([
      apiFetch<Appointment>(`/appointments/${apptId}`),
      apiFetch<{ id: number; first_name: string; last_name: string }[]>('/doctors'),
      apiFetch<{ id: number; first_name: string; last_name: string }[]>('/patients'),
    ])
      .then(([appt, docs, pats]) => {
        setData(appt)
        setDoctorId(appt.doctor_id)
        setPatientId(appt.patient_id)
        // ISO → datetime-local
        const dt = new Date(appt.appt_time)
        const pad = (n: number) => n.toString().padStart(2, '0')
        setApptTime(
          `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
        )
        setDoctors(docs.map(d => ({ id: d.id, label: `${d.first_name} ${d.last_name}` })))
        setPatients(pats.map(p => ({ id: p.id, label: `${p.first_name} ${p.last_name}` })))
      })
      .catch(e => setError(e.message))
  }, [apptId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || !doctorId || !patientId || !apptTime) return
    setSaving(true)
    const iso = new Date(apptTime).toISOString().replace(/\.\d+Z$/, 'Z')
    try {
      await apiFetch<void>('/appointments', {
        method: 'PUT',
        body: JSON.stringify({ id: apptId, doctor_id: doctorId, patient_id: patientId, appt_time: iso }),
      })
      router.push('/dashboard/appointments')
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  if (error) return <p className="p-4 text-red-400">{error}</p>
  if (!data) return <p className="p-4 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Редактировать приём #{apptId}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Доктор</span>
            <select
              className={glassInput}
              value={doctorId}
              onChange={e => setDoctorId(Number(e.target.value))}
              required
            >
              <option value="">— выберите —</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Пациент</span>
            <select
              className={glassInput}
              value={patientId}
              onChange={e => setPatientId(Number(e.target.value))}
              required
            >
              <option value="">— выберите —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Дата и время</span>
            <input
              type="datetime-local"
              className={glassInput}
              value={apptTime}
              onChange={e => setApptTime(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className={`${btnBase} ${btnSave}`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </form>

        <button onClick={() => router.back()} className={linkCancel}>
          Отмена
        </button>
      </motion.div>
    </div>
  )
}
