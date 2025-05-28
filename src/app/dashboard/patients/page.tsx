// src/app/dashboard/patients/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

type Patient = {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string
  created_at: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [error,    setError]    = useState<string|null>(null)

  /* — общие стили — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnAdd      = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white"
  const btnEdit     = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white"
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white"
  const rowHover    = "hover:bg-white/5 transition-colors"

  useEffect(() => {
    apiFetch<Patient[]>('/patients')
      .then(setPatients)
      .catch(err => setError(err.message))
  }, [])

  if (error) return <p className="p-6 text-red-400">{error}</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-3xl mx-auto ${glassCard} p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${headerText}`}>Пациенты</h1>
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead className="text-left text-gray-300">
              {['ID','Имя','Фамилия','ДР','Создано','Действия'].map(col => (
                <th key={col} className="px-4 py-2">{col}</th>
              ))}
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-t border-white/20 ${rowHover}`}
                >
                  <td className="px-4 py-3 text-gray-200">{p.id}</td>
                  <td className="px-4 py-3 text-gray-200">{p.first_name}</td>
                  <td className="px-4 py-3 text-gray-200">{p.last_name}</td>
                  <td className="px-4 py-3 text-gray-200">
                    {new Date(p.date_of_birth).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-gray-200">
                    {new Date(p.created_at).toLocaleString('ru-RU', {
                      dateStyle: 'short', timeStyle: 'short'
                    })}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    
                    <button
                      className={btnDelete}
                      onClick={async () => {
                        if (!confirm('Удалить пациента?')) return
                        try {
                          await apiFetch<void>(`/patients/${p.id}`, { method: 'DELETE' })
                          setPatients(prev => prev.filter(x => x.id !== p.id))
                        } catch (e: any) {
                          alert('Ошибка удаления: ' + e.message)
                        }
                      }}
                    >
                      Удл.
                    </button>
                  </td>
                </motion.tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    Нет пациентов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
