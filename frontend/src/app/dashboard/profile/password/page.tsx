// src/app/profile/password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

export default function PasswordChangePage() {
  const router = useRouter()
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setError('Новый пароль и его подтверждение не совпадают')
      return
    }
    setSubmitting(true)
    try {
      await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      })
      router.push('/dashboard/profile')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const glassCard   = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg"
  const glassInput  = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
  const btnBase     = "w-full py-2 rounded-lg font-medium transition-colors"
  const btnChange   = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`max-w-md w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          Сменить пароль
        </h1>

        {error && (
          <div className="text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Старый пароль</label>
            <input
              type="password"
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              className={glassInput}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Новый пароль</label>
            <input
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className={glassInput}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Подтверждение пароля</label>
            <input
              type="password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              className={glassInput}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`${btnBase} ${btnChange}`}
          >
            {submitting ? 'Сохраняем…' : 'Сменить'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
