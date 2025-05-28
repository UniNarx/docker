// src/app/dashboard/doctors/patients/[id]/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function CreateMedicalRecordPage() {
  const { id: patientId } = useParams()
  const router = useRouter()

  const [visitDate, setVisitDate] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [notes, setNotes]       = useState('')
  const [files, setFiles]       = useState<FileList | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  /* — стили «glass & dark» — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
  const btnBase    = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400 disabled:opacity-50"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // 1) создать запись без файлов
      const record = await apiFetch<{ id: number }>(
        '/medical_records',
        {
          method: 'POST',
          body: JSON.stringify({
            patient_id: Number(patientId),
            visit_date: visitDate,
            notes,
          }),
        }
      )

      // 2) загрузить вложения
      if (files && files.length > 0) {
        const form = new FormData()
        Array.from(files).forEach(f => form.append('files', f))
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}` +
            `/medical_records/${record.id}/attachments`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: form,
          }
        )
      }

      router.push(`/dashboard/doctors/patients/${patientId}`)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-lg mx-auto ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-teal-300">
          Новая запись в медкарте
        </h1>

        {error && (
          <div className="text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2">
            Ошибка: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Дата приёма</label>
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className={glassInput}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Заметки</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`${glassInput} h-24 resize-none`}
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Вложения</label>
            <input
              type="file"
              multiple
              onChange={e => setFiles(e.target.files)}
              className={glassInput}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`${btnBase} ${btnSave}`}
          >
            {submitting ? 'Сохраняем…' : 'Сохранить запись'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
