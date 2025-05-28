'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Извлекаем userId и roleId (строки) из JWT в localStorage
function parseToken() {
  const token = localStorage.getItem('token')
  if (!token) return { userId: '', roleId: '' }
  try {
    const { userId, roleId } = JSON.parse(atob(token.split('.')[1]))
    return { userId, roleId }
  } catch {
    return { userId: '', roleId: '' }
  }
}

// Константы ID ролей — те же, что в NavBar
const ROLE_IDS = {
  PATIENT:    '6836ec7ff5b12770e1c81b34',
  DOCTOR:     '6836ec7ff5b12770e1c81b35',
  ADMIN:      '6836ec7ff5b12770e1c81b36',
  SUPERADMIN: '6836ec7ff5b12770e1c81b37',
} as const

const ROLE_LABELS: Record<string, string> = {
  [ROLE_IDS.PATIENT]:    'Пациент',
  [ROLE_IDS.DOCTOR]:     'Врач',
  [ROLE_IDS.ADMIN]:      'Администратор',
  [ROLE_IDS.SUPERADMIN]: 'СуперАдмин',
}

type Profile = {
  id: string
  username: string
  roleId: string
  createdAt: string
}

export default function ProfilePage() {
  const { roleId: tokenRoleId } = parseToken()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [admins, setAdmins] = useState<Profile[]>([])
  const [adminsError, setAdminsError] = useState<string | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  // Загружаем данные моего профиля
  useEffect(() => {
    apiFetch<Profile>('/users/me')
      .then(setProfile)
      .catch(err => setError(err.message))
  }, [])

  // Если я СуперАдмин — подгружаем список Админов
  useEffect(() => {
    if (tokenRoleId === ROLE_IDS.SUPERADMIN) {
      setLoadingAdmins(true)
      apiFetch<Profile[]>(`/users?roleId=${ROLE_IDS.ADMIN}`)
        .then(data => setAdmins(Array.isArray(data) ? data : []))
        .catch(err => setAdminsError(err.message))
        .finally(() => setLoadingAdmins(false))
    }
  }, [tokenRoleId])

  const deleteAdmin = async (adminId: string) => {
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
        className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 space-y-6 text-white"
      >
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Профиль
        </h1>

        <div className="space-y-2">
          <p><strong>Username:</strong> {profile.username}</p>
          <p>
            <strong>Role:</strong>{' '}
            {ROLE_LABELS[profile.roleId] || profile.roleId}
          </p>
          <p>
            <strong>Создан:</strong>{' '}
            {new Date(profile.createdAt)
              .toLocaleDateString('ru-RU')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard/profile/edit">
            <button className="px-4 py-2 rounded-lg font-medium transition-colors text-white bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400">
              Редактировать
            </button>
          </Link>
          <Link href="/dashboard/profile/password">
            <button className="px-4 py-2 rounded-lg font-medium transition-colors text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500">
              Сменить пароль
            </button>
          </Link>
          {tokenRoleId === ROLE_IDS.SUPERADMIN && (
            <Link href="/dashboard/profile/create-admin">
              <button className="px-4 py-2 rounded-lg font-medium transition-colors text-white bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400">
                Добавить админа
              </button>
            </Link>
          )}
        </div>

        {tokenRoleId === ROLE_IDS.SUPERADMIN && (
          <section className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 space-y-4">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Список администраторов
            </h2>

            {loadingAdmins && <p className="text-gray-300">Загрузка админов…</p>}
            {adminsError && <p className="text-red-400">{adminsError}</p>}

            {!loadingAdmins && admins.length === 0 && (
              <p className="text-gray-300">Пока нет администраторов.</p>
            )}

            <ul className="space-y-2">
              {admins.map(a => (
                <li key={a.id} className="flex justify-between items-center">
                  <span>
                    <strong>{a.username}</strong>{' '}
                    <small className="text-gray-300">
                      (создан: {new Date(a.createdAt).toLocaleDateString('ru-RU')})
                    </small>
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
