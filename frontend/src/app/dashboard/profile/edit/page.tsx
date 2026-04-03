'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
  Edit, 
  ChevronLeft, 
  Loader2, 
  Check, 
  AlertCircle, 
  User,
  RefreshCw
} from 'lucide-react'

// --- Types ---
type UserMeResponse = {
  data: {
    id: string;
    username: string;
    roleName: string;
  };
};

type UpdateUserResponse = {
    message?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  iconCircle: "w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-inner",
  title: "text-2xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all",
  
  btnSave: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:scale-100 disabled:bg-slate-200 disabled:text-slate-400 mt-4",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors mt-8 w-full",
};

export default function ProfileEditPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserMeResponse>('/users/me')
      .then(response => {
        if (response?.data?.username) {
          setUsername(response.data.username);
          setInitialUsername(response.data.username);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const isUnchanged = username.trim() === initialUsername || !username.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnchanged) return;

    setSaving(true);
    setError(null);
    try {
      await apiFetch<UpdateUserResponse>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ username: username.trim() }),
      });
      alert("Идентификатор успешно обновлен");
      router.push('/dashboard/profile');
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className={styles.layout}>
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className={styles.layout}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <header className={styles.header}>
          <div className={styles.iconCircle}>
            <Edit size={32} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Смена ID</h1>
          <p className={styles.subtitle}>Обновление имени пользователя</p>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase mb-8">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="relative">
            <label className={styles.label}>
              <User size={12} /> Username в системе
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><User size={18} /></div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Введите новый логин"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || isUnchanged}
              className={styles.btnSave}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isUnchanged ? (
                "Нет изменений"
              ) : (
                <><Check size={18} /> Сохранить изменения</>
              )}
            </button>
          </div>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
          disabled={saving}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Отмена
        </button>

        {/* Фоновый декоративный элемент */}
        <div className="absolute -bottom-12 -right-12 text-slate-50 opacity-50 pointer-events-none">
          <RefreshCw size={120} />
        </div>
      </motion.div>
    </div>
  );
}