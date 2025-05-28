// src/app/dashboard/doctors/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Doctor = {
  id: number
  first_name: string
  last_name: string
  specialty: string
  created_at: string
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [error, setError]     = useState<string|null>(null)

  /* — общие стили — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnAdd      = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white"
  const btnEdit     = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white"
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white"
  const rowHover    = "hover:bg-white/5 transition-colors"

  useEffect(() => {
    apiFetch<Doctor[]>('/doctors')
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
  }, [])

  if (error)       return <p className="p-4 text-red-400">{error}</p>
  if (!doctors)    return <p className="p-4 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-3xl mx-auto ${glassCard} p-6 text-white`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${headerText}`}>Врачи</h1>
          <Link href="/dashboard/doctors/create">
            <button className={btnAdd}>Добавить врача</button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['ID','Имя','Фамилия','Специализация','Создано','Действия'].map(col => (
                  <th key={col} className="px-4 py-2">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} className={`border-t border-white/20 ${rowHover}`}>
                  <td className="px-4 py-3 text-gray-200">{d.id}</td>
                  <td className="px-4 py-3 text-gray-200">{d.first_name}</td>
                  <td className="px-4 py-3 text-gray-200">{d.last_name}</td>
                  <td className="px-4 py-3 text-gray-200">{d.specialty}</td>
                  <td className="px-4 py-3 text-gray-200">
                    {new Date(d.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link href={`/dashboard/doctors/${d.id}/edit`}>
                      <button className={btnEdit}>Ред.</button>
                    </Link>
                    <button
                      className={btnDelete}
                      onClick={async () => {
                        if (!confirm('Удалить врача?')) return
                        try {
                          await apiFetch<void>(`/doctors/${d.id}`, { method: 'DELETE' })
                          setDoctors(prev => prev.filter(x => x.id !== d.id))
                        } catch (err: any) {
                          alert('Ошибка: ' + err.message)
                        }
                      }}
                    >
                      Удл.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
