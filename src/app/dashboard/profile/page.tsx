// src/app/dashboard/profile/page.tsx
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

type Profile = {
  id: number
  username: string
  role_id: number
  created_at: string
}

const ROLE_NAMES: Record<number, string> = {
  1: 'User',
  2: 'Administrator',
  3: 'Admin',
  4: 'SuperAdmin',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [admins, setAdmins] = useState<Profile[]>([])
  const [adminsError, setAdminsError] = useState<string | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  /* — common glassmorphism styles — */
  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const headerText  = "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"
  const btnBase     = "px-4 py-2 rounded-lg font-medium transition-colors text-white"
  const btnEdit     = "bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400"
  const btnPwd      = "bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500"
  const btnAddAdmin = "bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400"
  const errorBox    = "text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2"

  useEffect(() => {
    apiFetch<Profile>('/users/me')
      .then(setProfile)
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    if (profile?.role_id === 4) {
      setLoadingAdmins(true)
      apiFetch<Profile[]>('/users?role_id=3')
        .then(data => setAdmins(Array.isArray(data) ? data : []))
        .catch(err => setAdminsError(err.message))
        .finally(() => setLoadingAdmins(false))
    }
  }, [profile])

  const deleteAdmin = async (adminId: number) => {
    if (!confirm('Удалить этого администратора?')) return
    try {
      await apiFetch<void>(`/users/${adminId}`, { method: 'DELETE' })
      setAdmins(prev => prev.filter(a => a.id !== adminId))
    } catch (err: any) {
      alert('Ошибка при удалении: ' + err.message)
    }
  }

  if (error)   return <p className="p-6 text-red-400">{error}</p>
  if (!profile) return <p className="p-6 text-gray-300">Загрузка…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className={`text-3xl font-bold text-center ${headerText}`}>
          Профиль
        </h1>

        <div className="space-y-2">
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Role:</strong> {ROLE_NAMES[profile.role_id] || profile.role_id}</p>
          
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/profile/edit">
            <button className={`${btnBase} ${btnEdit}`}>Редактировать</button>
          </Link>
          <Link href="/dashboard/profile/password">
            <button className={`${btnBase} ${btnPwd}`}>Сменить пароль</button>
          </Link>
          {profile.role_id === 4 && (
            <Link href="/dashboard/profile/create-admin">
              <button className={`${btnBase} ${btnAddAdmin}`}>Добавить админа</button>
            </Link>
          )}
        </div>

        {profile.role_id === 4 && (
          <section className={`${glassCard} p-4 space-y-4`}>
            <h2 className={`text-xl font-semibold ${headerText}`}>Список администраторов</h2>
            {loadingAdmins && <p className="text-gray-300">Загрузка админов…</p>}
            {adminsError && <p className="text-red-400">{adminsError}</p>}
            {!loadingAdmins && admins.length === 0 && (
              <p className="text-gray-300">Пока нет администраторов с ролью 3.</p>
            )}
            <ul className="space-y-2">
              {admins.map(a => (
                <li key={a.id} className="flex justify-between items-center">
                  <span className="text-white">
                    <strong>{a.username}</strong> {' '}
                    <small className="text-gray-300">(создан: {new Date(a.created_at).toLocaleDateString('ru-RU')})</small>
                  </span>
                  <button
                    onClick={() => deleteAdmin(a.id)}
                    className="text-red-400 hover:text-red-200 underline"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.div>
    </div>
  )
}
