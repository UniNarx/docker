/* src/app/public/login/page.tsx */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { LogIn, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { token } = await apiFetch<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      
      localStorage.setItem('token', token)
      window.dispatchEvent(new Event('token-changed'))

      const payload = JSON.parse(atob(token.split('.')[1]))
      const roleId: number = payload.role_id
      
      // Логика редиректа: врачи и админы в дашборд, пациенты на главную
      if (roleId > 2) {
        router.push('/dashboard/doctors')
      } else {
        router.push('/public/doctors')
      }
    } catch (err: any) {
      setError(err.message || "Неверный логин или пароль")
    } finally {
      setLoading(false)
    }
  }

  const styles = {
    card: "max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 border-4 border-white p-10 relative overflow-hidden",
    input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-12 pr-4 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-300",
    label: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4 block",
    btnPrimary: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50",
    btnSecondary: "w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors"
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-inner">
            <LogIn size={28} />
          </div>
          <h1 className="text-3xl font-black text-[#1e3a8a] tracking-tighter">С возвращением</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Авторизация в DockerMed</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-500 p-4 rounded-[20px] text-[10px] font-black uppercase flex items-center gap-3 mb-6 border-2 border-red-100">
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className={styles.label}>Логин</label>
            <User className="absolute left-4 bottom-[18px] text-slate-300" size={18} />
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className={styles.input} 
              placeholder="admin_user"
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
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? "Вход..." : <><ArrowRight size={16} /> Войти в систему</>}
          </button>
        </form>

        <button onClick={() => router.push('/public/register')} className={styles.btnSecondary}>
          Нет аккаунта? Создать профиль
        </button>
      </motion.div>
    </div>
  )
}