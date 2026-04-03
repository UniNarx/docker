'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  User, 
  ChevronLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react'

// --- Types ---
type CreateAdminForm = {
  username: string;
  password: string;
  role: 'Admin' | 'SuperAdmin';
};

type CreateAdminResponse = {
  message?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  iconCircle: "w-16 h-16 bg-slate-50 text-indigo-600 rounded-[22px] flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-inner",
  title: "text-2xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all",
  
  select: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-10 text-sm font-bold text-[#1e3a8a] outline-none appearance-none focus:border-indigo-500/20 focus:bg-white transition-all cursor-pointer",
  
  btnCreate: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors mt-8 w-full",
};

export default function CreateAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateAdminForm>({
    username: '',
    password: '',
    role: 'Admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value as CreateAdminForm['role'] }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<CreateAdminResponse>('/auth/register-admin', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert(response?.message || 'Пользователь успешно создан');
      router.push('/dashboard/profile');
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.layout}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.card}
      >
        <header className={styles.header}>
          <div className={styles.iconCircle}>
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Новый доступ</h1>
          <p className={styles.subtitle}>Создание системного аккаунта</p>
        </header>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase mb-8"
          >
            <ShieldAlert size={18} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><User size={12} /> Имя пользователя</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><User size={18} /></div>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                className={styles.input}
                placeholder="admin_2024"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Lock size={12} /> Временный пароль</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Lock size={18} /></div>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><ShieldCheck size={12} /> Уровень полномочий</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><ShieldCheck size={18} /></div>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="Admin">Administrator</option>
                <option value="SuperAdmin">Super Administrator</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <ChevronLeft size={16} className="-rotate-90" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={styles.btnCreate}
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><CheckCircle2 size={18} /> Активировать доступ</>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Вернуться в профиль
        </button>
      </motion.div>
    </div>
  );
}