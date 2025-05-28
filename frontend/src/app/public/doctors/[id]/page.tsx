// src/app/public/doctors/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

/* -------------------- типы -------------------- */
type Doctor = {
  id: number
  first_name: string
  last_name: string
  specialty: string
}

export default function DoctorProfilePage() {
  const { id } = useParams()
  const docId = Number(id)

  /* ---------- auth ---------- */
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null
  const roleId = payload?.role_id ?? 0

  /* ---------- state ---------- */
  const [patId, setPatId] = useState<number | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [docErr, setDocErr] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState<string>(today)
  const [slots, setSlots] = useState<string[]>([])
  const [slotErr, setSlotErr] = useState<string | null>(null)
  const [bookingSlot, setBookingSlot] = useState<string>('')

  /* стили */
  const glassCard = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput = "bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2"
  const btnBase = "px-4 py-2 font-medium rounded-lg transition"
  const slotBtn = (active: boolean) =>
    `text-white ${btnBase} ${active ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg" : "bg-white/20 hover:bg-white/30"}`

  /* ---------- эффекты ---------- */
  useEffect(() => {
    if (!token || roleId !== 1) return
    apiFetch<{ id: number }>('/patients/me')
      .then(p => setPatId(p.id))
      .catch(() => setPatId(null))
  }, [token, roleId])

  useEffect(() => {
    apiFetch<Doctor[]>('/doctors')
      .then(list => {
        const d = list.find(x => x.id === docId)
        if (!d) throw new Error('Врач не найден')
        setDoctor(d)
      })
      .catch(e => setDocErr(e.message))
  }, [docId])

  useEffect(() => {
    setSlots([])
    setSlotErr(null)
    apiFetch<string[]>(`/availability?doctor_id=${docId}&date=${date}`)
      .then(setSlots)
      .catch(e => setSlotErr(e.message))
  }, [docId, date])

  const handleBook = async () => {
    if (!bookingSlot || patId == null) return
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: docId,
          patient_id: patId,
          appt_time: `${date}T${bookingSlot}:00Z`,
        }),
      })
      alert('Приём успешно забронирован')
      const fresh = await apiFetch<string[]>(`/availability?doctor_id=${docId}&date=${date}`)
      setSlots(fresh)
      setBookingSlot('')
    } catch (e: any) {
      alert('Ошибка при бронировании: ' + e.message)
    }
  }

  if (docErr) return <p className="p-4 text-red-600">Ошибка: {docErr}</p>
  if (!doctor) return <p className="p-4 text-white">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-2xl mx-auto ${glassCard} p-8 space-y-6 text-white`}
      >
        {/* Заголовок */}
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          {doctor.first_name} {doctor.last_name}
        </h1>
        <p className="inline-block px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-sm font-medium text-gray-100">
          {doctor.specialty}
        </p>

        {/* Выбор даты */}
        <div className="space-y-1">
          <label className="block text-sm font-medium">Дата приёма:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className={glassInput}
          />
        </div>

        {/* Слоты */}
        <div>
          {slotErr && <p className="text-red-400 mb-2">Не удалось загрузить слоты: {slotErr}</p>}
          <div className="grid grid-cols-3 gap-3">
            {slots.length === 0 ? (
              <span className="col-span-3 text-gray-400">Нет свободных слотов</span>
            ) : (
              slots.map(t => (
                <button
                  key={t}
                  onClick={() => setBookingSlot(t)}
                  className={slotBtn(bookingSlot === t)}
                >
                  {t}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Бронирование */}
        {!token && (
          <a href="/public/login" className="text-indigo-300 hover:underline">
            Войдите, чтобы записаться
          </a>
        )}
        {token && roleId !== 1 && (
          <p className="text-gray-300">Запись доступна только пациентам</p>
        )}
        {token && roleId === 1 && (
          <button
            disabled={!bookingSlot || patId == null}
            onClick={handleBook}
            className={`${btnBase} ${
              bookingSlot && patId
                ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white hover:from-teal-400 hover:to-green-400'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {patId
              ? `Записаться на ${bookingSlot}`
              : 'Загрузка профиля…'}
          </button>
        )}
      </motion.div>
    </div>
  )
}
