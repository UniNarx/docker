// src/app/dashboard/doctors/patients/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Patient = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
}

type MedicalRecord = {
  id: number
  visit_date: string
  notes?: string
}

export default function DoctorViewPatient() {
  const { id } = useParams()
  const patientId = Number(id)
  const router = useRouter()

  const [pat,  setPat]  = useState<Patient | null>(null)
  const [recs, setRecs] = useState<MedicalRecord[] | null>(null)
  const [errP, setErrP] = useState<string | null>(null)
  const [errR, setErrR] = useState<string | null>(null)

  /* — common styles — */
  const glassCard    = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText   = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnAdd       = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400"
  const btnEdit      = "text-indigo-300 hover:text-indigo-100 underline transition-colors"
  const sectionSpace = "space-y-4"

  /* — fetch patient — */
  useEffect(() => {
    apiFetch<Patient>(`/patients/${patientId}`)
      .then(setPat)
      .catch(e => setErrP(e.message))
  }, [patientId])

  /* — handle expired session — */
  useEffect(() => {
    if ((errP?.startsWith('401') || errR?.startsWith('401'))) {
      alert('Сессия истекла, войдите снова')
      localStorage.removeItem('token')
      router.push('/public/login')
    }
  }, [errP, errR, router])

  /* — fetch records — */
  useEffect(() => {
    apiFetch<MedicalRecord[]>(`/patients/${patientId}/medical_records`)
      .then(setRecs)
      .catch(e => setErrR(e.message))
  }, [patientId])

  const createRecord = async () => {
    const date  = prompt('Дата визита (YYYY-MM-DD):', new Date().toISOString().slice(0, 10))
    if (!date) return
    const notes = prompt('Заметки (необязательно):', '') || undefined
    try {
      const rec = await apiFetch<MedicalRecord>('/medical_records', {
        method: 'POST',
        body: JSON.stringify({ patient_id: patientId, visit_date: date, notes }),
      })
      setRecs(prev => prev ? [...prev, rec] : [rec])
    } catch (e: any) {
      alert('Ошибка: ' + e.message)
    }
  }

  if (errP)       return <p className="p-6 text-red-400">{`Пациент: ${errP}`}</p>
  if (!pat)       return <p className="p-6 text-gray-300">Загрузка данных пациента…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-3xl mx-auto ${glassCard} p-6 ${sectionSpace}`}
      >
        {/* Паспортка */}
        <section className={sectionSpace}>
          <h1 className={`text-2xl font-bold ${headerText}`}>
            {pat.first_name} {pat.last_name}
          </h1>
          <p className="text-gray-200">
            Дата рождения: {new Date(pat.date_of_birth).toLocaleDateString('ru-RU')}
          </p>
        </section>

        {/* Медкарты */}
        <section className={sectionSpace}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-semibold ${headerText}`}>Медкарты</h2>
            <button onClick={createRecord} className={btnAdd}>
              + Новая запись
            </button>
          </div>

          {errR && <p className="text-red-400">Медкарты: {errR}</p>}
          {!errR && recs === null && <p className="text-gray-300">Загрузка медкарт…</p>}
          {!errR && recs?.length === 0 && <p className="text-gray-300">Записей пока нет</p>}

          {recs && recs.length > 0 && (
            <ul className="space-y-3">
              {recs.map(r => (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-3 rounded-lg"
                >
                  <div className="text-gray-200">
                    <strong>{new Date(r.visit_date).toLocaleDateString('ru-RU')}</strong>
                    {r.notes && <> — {r.notes}</>}
                  </div>
                  <Link href={`/dashboard/doctors/patients/${patientId}/medical_records/${r.id}/edit`}>
                    <button className={btnEdit}>Редактировать</button>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <button
          onClick={() => router.back()}
          className="mt-4 text-indigo-300 hover:underline"
        >
          ← Назад к списку пациентов
        </button>
      </motion.div>
    </div>
  )
}
