// src/app/dashboard/appointments/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

function parseToken() {
  const token = localStorage.getItem('token')
  if (!token) return { user_id: 0, role_id: 0 }
  try {
    const pl: any = JSON.parse(atob(token.split('.')[1]))
    return { user_id: Number(pl.user_id), role_id: Number(pl.role_id) }
  } catch {
    return { user_id: 0, role_id: 0 }
  }
}

type Appointment = {
  id: number
  doctor_id: number
  patient_id: number
  appt_time: string
  created_at: string
}
type NameMap = Record<number, string>
type DocProfile = { id: number; user_id: number; first_name: string; last_name: string }
type PatProfile = { id: number; user_id: number; first_name: string; last_name: string }

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<Appointment[]|null>(null)
  const [doctors, setDoctors]   = useState<NameMap>({})
  const [patients,setPatients]  = useState<NameMap>({})
  const [error,    setError]    = useState<string|null>(null)

  /* — common glass & dark styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnAdd      = "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white"
  const btnEdit     = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white"
  const btnDelete   = "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white"
  const rowHover    = "hover:bg-white/5 transition-colors"

  useEffect(() => {
    const { user_id, role_id } = parseToken()

    Promise.all([
      apiFetch<DocProfile[]>('/doctors'),
      apiFetch<PatProfile[]>('/patients'),
      apiFetch<Appointment[]>('/appointments'),
    ])
      .then(([docList, patList, apptList]) => {
        // build name maps
        const dmap: NameMap = {}
        docList.forEach(d => { dmap[d.id] = `${d.first_name} ${d.last_name}` })
        const pmap: NameMap = {}
        patList.forEach(p => { pmap[p.id] = `${p.first_name} ${p.last_name}` })
        setDoctors(dmap)
        setPatients(pmap)

        let filtered = apptList
        if (role_id === 1) {
          const myPat = patList.find(p => p.user_id === user_id)
          filtered = myPat ? apptList.filter(a => a.patient_id === myPat.id) : []
        } else if (role_id === 2) {
          const myDoc = docList.find(d => d.user_id === user_id)
          filtered = myDoc ? apptList.filter(a => a.doctor_id === myDoc.id) : []
        }
        setAppts(filtered)
      })
      .catch(err => setError(err.message))
  }, [])

  if (error)      return <p className="p-6 text-red-400">{error}</p>
  if (appts===null) return <p className="p-6 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${headerText}`}>Приёмы</h1>
          <Link href="/dashboard/appointments/create">
            <button className={btnAdd}>Добавить приём</button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
            <thead>
              <tr className="text-left text-gray-300">
                {['ID','Доктор','Пациент','Время','Действия'].map(col => (
                  <th key={col} className="px-4 py-2">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    Нет приёмов
                  </td>
                </tr>
              ) : (
                appts.map(a => (
                  <tr key={a.id} className={`border-t border-white/20 ${rowHover}`}>
                    <td className="px-4 py-3 text-gray-200">{a.id}</td>
                    <td className="px-4 py-3 text-gray-200">{doctors[a.doctor_id]}</td>
                    <td className="px-4 py-3 text-gray-200">{patients[a.patient_id]}</td>
                    <td className="px-4 py-3 text-gray-200">
                      {new Date(a.appt_time).toLocaleString('ru-RU', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link href={`/dashboard/appointments/${a.id}/edit`}>
                        <button className={btnEdit}>Ред.</button>
                      </Link>
                      <button
                        className={btnDelete}
                        onClick={async () => {
                          if (confirm('Удалить приём?')) {
                            await apiFetch<void>(`/appointments/${a.id}`, { method: 'DELETE' })
                            setAppts(prev => prev!.filter(x => x.id !== a.id))
                          }
                        }}
                      >
                        Удл.
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
