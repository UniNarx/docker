// src/app/dashboard/doctors/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import { motion } from 'framer-motion'

type Doctor = {
  id: number
  user_id: number
  first_name: string
  last_name: string
  specialty: string
}

export default function DoctorProfilePage() {
  const [doc, setDoc]     = useState<Doctor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  /* — common glass styles — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnBase    = "px-4 py-2 rounded-lg font-medium transition-colors text-white"
  const btnPwd     = "bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500"
  const btnEdit    = "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400"

  useEffect(() => {
    apiFetch<Doctor>('/doctors/me')
      .then(setDoc)
      .catch(e => {
        if (e.message.startsWith('401')) {
          alert('Сессия истекла. Войдите снова.')
          localStorage.removeItem('token')
          router.push('/public/login')
        } else {
          setError(e.message)
        }
      })
  }, [router])

  if (error) return <p className="p-4 text-red-400">{error}</p>
  if (!doc)  return <p className="p-4 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className={`text-3xl font-bold ${headerText}`}>
          {doc.first_name} {doc.last_name}
        </h1>
        <p className="text-gray-200">
          <strong>Специализация:</strong> {doc.specialty}
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/doctors/profile/password">
            <button className={`${btnBase} ${btnPwd}`}>
              Сменить пароль
            </button>
          </Link>
          <Link href="/dashboard/doctors/profile/edit">
            <button className={`${btnBase} ${btnEdit}`}>
              Редактировать
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
