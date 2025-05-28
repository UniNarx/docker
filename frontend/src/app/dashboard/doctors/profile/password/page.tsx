// src/app/profile/password/page.tsx  (или где у вас лежит)
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function PasswordChangePage() {
  const router = useRouter()
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState<string>()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setError('Новый пароль и его подтверждение не совпадают')
      return
    }
    try {
      await apiFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      })
      router.push('/dashboard/doctors/profile')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded text-black">
      <h1 className="text-2xl mb-4">Сменить пароль</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label>Старый пароль</label>
          <input
            type="password"
            value={oldPass}
            onChange={e => setOldPass(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label>Новый пароль</label>
          <input
            type="password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label>Подтверждение пароля</label>
          <input
            type="password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Сменить
        </button>
      </form>
    </div>
  )
}
