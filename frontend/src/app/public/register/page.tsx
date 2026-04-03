/* src/app/public/register/page.tsx */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { UserPlus, User, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await apiFetch<{ id: number }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setSuccess(true)
      setTimeout(() => router.push('/public/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const styles = {
    card: "max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 border-4 border-white p-10 relative overflow-hidden",
    input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-12 pr-4 text-sm font-bold text-[#1e3a8a] outline-none focus:border-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300",
    label: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 block",
    btnPrimary: "w-full bg-emerald-500 text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4",
    btnBack: "absolute top-6 left-6 text-slate-300 hover:text-indigo-600 transition-colors"
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.card}
      >
        <button onClick={() => router.push('/public/login')} className={styles.btnBack}>
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-[22px] flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-inner">
            <UserPlus size={28} />
          </div>
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tighter">Регистрация</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Присоединяйтесь к DockerMed</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-500 p-4 rounded-[20px] text-[10px] font-black uppercase flex items-center gap-3 mb-6 border-2 border-red-100">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        {success ? (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-10">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-xl font-black text-[#1e3a8a] mb-2">Готово!</h2>
            <p className="text-slate-400 text-xs font-bold">Аккаунт создан. Переходим к входу...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className={styles.label}>Новый логин</label>
              <User className="absolute left-4 bottom-[18px] text-slate-300" size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className={styles.input} 
                placeholder="my_profile_2024"
                required 
              />
            </div>

            <div className="relative">
              <label className={styles.label}>Пароль</label>
              <Lock className="absolute left-4 bottom-[18px] text-slate-300" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className={styles.input} 
                placeholder="минимум 6 символов"
                required 
              />
            </div>

            <button type="submit" className={styles.btnPrimary}>
              Создать аккаунт
            </button>
          </form>
        )}

        {!success && (
          <p className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Нажимая кнопку, вы соглашаетесь с правилами клиники
          </p>
        )}
      </motion.div>
    </div>
  )
}