// src/app/dashboard/doctors/patients/[patientId]/records/[id]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

/* ---------- типы ---------- */
type MedicalRecord = {
  id: number
  patient_id: number
  doctor_id: number
  visit_date: string
  notes?: string
  attachments?: string[]
}

export default function EditMedicalRecordPage() {
  const { patientId, recordId } = useParams() as {
    patientId: string
    recordId: string
  }
  const recId = Number(recordId)
  const router = useRouter()

  const [rec, setRec] = useState<MedicalRecord | null>(null)
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')        // YYYY-MM-DD
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  /* — стили «glass & dark» — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase    = "px-4 py-2 rounded-lg font-medium transition-colors"
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
  const btnDelete  = "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-pink-500 hover:to-red-500"
  const linkCancel = "text-indigo-300 hover:underline"

  /* — загрузка записи — */
  useEffect(() => {
    apiFetch<MedicalRecord>(`/medical_records/${recId}`)
      .then(r => {
        setRec(r)
        setDate(r.visit_date.slice(0, 10))
        setNotes(r.notes ?? '')
      })
      .catch(e => setErr(e.message))
  }, [recId])

  /* — сохранение — */
  const save = async () => {
    if (!date) return alert('Укажите дату визита')
    setSaving(true)
    try {
      await apiFetch(`/medical_records/${recId}`, {
        method: 'PUT',
        body: JSON.stringify({
          visit_date: date,
          notes,
          attachments: rec?.attachments ?? [],
        }),
      })
      alert('Сохранено')
      router.back()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* — удаление — */
  const del = async () => {
    if (!confirm('Удалить запись безвозвратно?')) return
    try {
      await apiFetch(`/medical_records/${recId}`, { method: 'DELETE' })
      alert('Удалено')
      router.back()
    } catch (e: any) {
      alert(e.message)
    }
  }

  /* — UI — */
  if (err)   return <p className="p-4 text-red-400">{err}</p>
  if (!rec)  return <p className="p-4 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 flex items-center justify-center !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-xl w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Редактирование записи #{rec.id}
        </h1>

        <label className="block space-y-1">
          <span className="font-medium">Дата визита</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={glassInput}
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Заметки</span>
          <textarea
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`${glassInput} resize-y`}
          />
        </label>

        <div className="flex gap-4 items-center">
          <button
            onClick={save}
            disabled={saving}
            className={`${btnBase} ${btnSave}`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>

          <button
            onClick={del}
            disabled={saving}
            className={`${btnBase} ${btnDelete}`}
          >
            Удалить
          </button>

          <button
            onClick={() => router.back()}
            className={linkCancel}
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </div>
  )
}
