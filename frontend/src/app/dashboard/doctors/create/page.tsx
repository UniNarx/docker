'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
  UserPlus, 
  Key, 
  Stethoscope, 
  User, 
  ChevronLeft, 
  ShieldCheck,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react'

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-2xl w-full bg-white rounded-[45px] shadow-2xl shadow-indigo-900/5 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "grid grid-cols-1 md:grid-cols-2 gap-6",
  fullWidth: "md:col-span-2",
  
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-300",
  
  btnSave: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors mt-8 w-full",
  
  sectionTitle: "md:col-span-2 text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em] flex items-center gap-4 before:h-px before:flex-1 before:bg-indigo-50 after:h-px after:flex-1 after:bg-indigo-50 mb-2 mt-4"
};

export default function DoctorCreatePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !firstName.trim() || !lastName.trim() || !specialty.trim()) {
      setError("Все поля обязательны для заполнения.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/doctors', {
        method: 'POST',
        body: JSON.stringify({ username, password, firstName, lastName, specialty }),
      });
      router.push('/dashboard/doctors');
    } catch (err: any) {
      setError(err.message || "Не удалось создать профиль врача.");
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
        {/* Декоративный элемент фона */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

        <div className={styles.header}>
          <div className="w-16 h-16 bg-indigo-50 text-[#1e3a8a] rounded-[22px] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Новый специалист</h1>
          <p className={styles.subtitle}>Создание учетной записи и медицинского профиля</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-tight mb-8">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.sectionTitle}>Данные входа</div>

          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><User size={12} /> Логин</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><User size={18} /></div>
              <input
                type="text"
                placeholder="ivanov_doc"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Key size={12} /> Пароль</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Key size={18} /></div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.sectionTitle}>Информация о враче</div>

          {/* First Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><ShieldCheck size={12} /> Имя</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Check size={18} /></div>
              <input
                type="text"
                placeholder="Иван"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Last Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><ShieldCheck size={12} /> Фамилия</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Check size={18} /></div>
              <input
                type="text"
                placeholder="Иванов"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Specialty */}
          <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
            <label className={styles.label}><Stethoscope size={12} /> Специализация</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Stethoscope size={18} /></div>
              <input
                type="text"
                placeholder="Например: Кардиолог, Терапевт"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.fullWidth}>
            <button
              type="submit"
              disabled={saving}
              className={styles.btnSave}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <><ShieldCheck size={18} /> Зарегистрировать врача</>
              )}
            </button>
          </div>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Отменить создание
        </button>
      </motion.div>
    </div>
  )
}