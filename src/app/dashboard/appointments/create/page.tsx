// src/app/appointments/create/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Option = { id: number; label: string }
type NameRecord = { id: number; first_name: string; last_name: string }

export default function AppointmentCreatePage() {
  const router = useRouter()

  const [doctors,  setDoctors]  = useState<Option[]>([])
  const [patients, setPatients] = useState<Option[]>([])
  const [doctorId, setDoctorId] = useState<number>()
  const [patientId,setPatientId]= useState<number>()
  const [apptTime, setApptTime] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [error,    setError]    = useState<string|null>(null)
  const [saving,   setSaving]   = useState(false)

  /* — стили glassmorphism — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400 disabled:opacity-50"
  const errorBox   = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2"

  /* — загрузка справочников — */
  useEffect(() => {
    apiFetch<NameRecord[]>('/doctors')
      .then(list => setDoctors(list.map(d => ({
        id: d.id,
        label: `${d.first_name} ${d.last_name}`
      }))))
      .catch(() => {})

    apiFetch<NameRecord[]>('/patients')
      .then(list => setPatients(list.map(p => ({
        id: p.id,
        label: `${p.first_name} ${p.last_name}`
      }))))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId || !patientId || !apptTime) return
    setSaving(true)
    const iso = new Date(apptTime).toISOString().replace(/\.\d+Z$/, 'Z')
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId,
          appt_time: iso,
        }),
      })
      router.push('/dashboard/appointments')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-300">
          Создать приём
        </h1>

        {error && <div className={errorBox}>{error}</div>}

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
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
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
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
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
            {saving ? 'Создаю…' : 'Создать приём'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
