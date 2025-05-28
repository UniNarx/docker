// src/app/dashboard/doctors/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Doctor = {
  id: number
  first_name: string
  last_name: string
  specialty: string
}

export default function DoctorEditPage() {
  const router = useRouter()
  const { id } = useParams()      // берём id из URL
  const docId = Number(id)

  const [data,     setData]     = useState<Doctor | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [specialty, setSpecialty] = useState('')
  const [saving,    setSaving]    = useState(false)

  /* — glass & dark styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave     = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"

  /* — загрузка доктора — */
  useEffect(() => {
    apiFetch<Doctor[]>('/doctors')
      .then(list => list.find(d => d.id === docId)!)
      .then(d => {
        setData(d)
        setFirstName(d.first_name)
        setLastName(d.last_name)
        setSpecialty(d.specialty)
      })
      .catch(err => setError(err.message))
  }, [docId])

  /* — сохранение — */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch<void>('/doctors', {
        method: 'PUT',
        body: JSON.stringify({
          id: docId,
          first_name: firstName,
          last_name: lastName,
          specialty,
        }),
      })
      router.push('/dashboard/doctors')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (error)  return <p className="p-6 text-red-400">{error}</p>
  if (!data)  return <p className="p-6 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Редактировать врача #{data.id}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="font-medium">Имя</span>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Фамилия</span>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={glassInput}
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="font-medium">Специализация</span>
            <input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className={glassInput}
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
      </motion.div>
    </div>
  )
}
