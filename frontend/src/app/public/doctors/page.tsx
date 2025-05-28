// src/app/public/doctors/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Doctor = {
  id: number
  first_name: string
  last_name: string
  specialty: string
}

export default function PublicDoctorsPage() {
  const [docs, setDocs] = useState<Doctor[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Doctor[]>('/doctors')
      .then(setDocs)
      .catch(err => setError(err.message))
  }, [])

  // 1. собираем и сортируем уникальные специальности
  const specialties = Array.from(new Set(docs.map(d => d.specialty)))
    .sort((a, b) => a.localeCompare(b))

  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-md"
  const btnPrimary = "inline-block px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 transition-colors duration-200"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <h1 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center">
        Врачи по специализациям
      </h1>

      {error && (
        <p className="max-w-2xl mx-auto text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2 mb-10">
          Ошибка: {error}
        </p>
      )}

      {specialties.map(spec => (
        <section key={spec} className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 border-b border-white/20 pb-1">
            {spec}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs
              .filter(d => d.specialty === spec)
              .map((d, idx) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className={`${glassCard} p-6 hover:shadow-lg transition-shadow`}
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {d.first_name} {d.last_name}
                  </h3>
                  <a
                    href={`/public/doctors/${d.id}`}
                    className={btnPrimary}
                  >
                    Подробнее
                  </a>
                </motion.div>
              ))
            }
          </div>
        </section>
      ))}

      {docs.length === 0 && !error && (
        <p className="text-gray-400 italic text-center">Врачей пока нет.</p>
      )}
    </div>
  )
}
