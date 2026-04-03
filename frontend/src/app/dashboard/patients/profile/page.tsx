'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  User, 
  Calendar, 
  VenusAndMars, 
  Save, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  HeartPulse
} from 'lucide-react'

// --- Types ---
type ApiPatientData = {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
};

type ApiProfileData = {
  _id?: string;
  id?: string;
  dob?: string;
  gender?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-xl w-full bg-white rounded-[45px] shadow-2xl shadow-slate-900/5 border-4 border-white p-8 md:p-12 relative overflow-hidden",
  
  header: "mb-10 text-center",
  iconCircle: "w-20 h-20 bg-rose-50 text-rose-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-inner",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-400 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-rose-200 focus:bg-white transition-all placeholder:text-slate-300",
  
  select: "w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] py-4 pl-14 pr-10 text-sm font-bold text-[#1e3a8a] outline-none appearance-none focus:border-rose-200 focus:bg-white transition-all cursor-pointer",
  
  btnSave: "w-full bg-[#1e3a8a] text-white rounded-[26px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4",
  btnPwd: "w-full bg-white border-2 border-slate-100 text-slate-400 rounded-[26px] py-5 font-black text-[11px] uppercase tracking-[0.2em] hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center gap-3 mt-4"
};

export default function PatientProfilePage() {
  const [patient, setPatient] = useState<ApiPatientData | null>(null);
  const [profile, setProfile] = useState<ApiProfileData>({});
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<ApiPatientData>('/patients/me'),
      apiFetch<ApiProfileData>('/profiles/patient').catch(() => ({} as ApiProfileData)),
    ])
    .then(([patData, profData]) => {
      if (patData) {
        setPatient(patData);
        setFname(patData.firstName || '');
        setLname(patData.lastName || '');
        if (patData.dateOfBirth && !profData.dob) setDob(patData.dateOfBirth.slice(0, 10));
      }
      if (profData) {
        setProfile(profData);
        if (profData.dob) setDob(profData.dob.slice(0, 10));
        setGender(profData.gender ?? '');
      }
    })
    .catch(e => setError(e.message))
    .finally(() => setIsLoading(false));
  }, []);

  const save = async () => {
    if (!fname.trim() || !lname.trim() || !dob) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await apiFetch<ApiPatientData>('/patients/me', {
        method: 'PUT',
        body: JSON.stringify({ firstName: fname, lastName: lname, dateOfBirth: dob }),
      });

      await apiFetch<ApiProfileData>('/profiles/patient', {
        method: profile?.id || profile?._id ? 'PUT' : 'POST',
        body: JSON.stringify({ dob, gender }),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return (
    <div className={styles.layout}>
      <Loader2 className="animate-spin text-rose-500" size={40} />
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
            <HeartPulse size={36} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Личные данные</h1>
          <p className={styles.subtitle}>Информация для вашей медкарты</p>
        </header>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-[22px] flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase mb-6">
                <AlertCircle size={18} /> {error}
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-[22px] flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase mb-6">
                <CheckCircle2 size={18} /> Данные успешно обновлены
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={styles.fieldGroup}>
              <label className={styles.label}><User size={12} /> Имя</label>
              <div className={styles.inputContainer}>
                <div className={styles.iconWrapper}><User size={18} /></div>
                <input value={fname} onChange={e => setFname(e.target.value)} className={styles.input} placeholder="Иван" />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}><User size={12} /> Фамилия</label>
              <div className={styles.inputContainer}>
                <div className={styles.iconWrapper}><User size={18} /></div>
                <input value={lname} onChange={e => setLname(e.target.value)} className={styles.input} placeholder="Иванов" />
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}><Calendar size={12} /> Дата рождения</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Calendar size={18} /></div>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={styles.input} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}><VenusAndMars size={12} /> Пол</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><VenusAndMars size={18} /></div>
              <select value={gender} onChange={e => setGender(e.target.value)} className={styles.select}>
                <option value="">Не указано</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <button onClick={save} disabled={saving} className={styles.btnSave}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Сохранить изменения</>}
            </button>
            <Link href="/dashboard/patients/profile/password">
              <button className={styles.btnPwd}>
                <Lock size={16} /> Безопасность
              </button>
            </Link>
          </div>
        </div>

        <button onClick={() => window.history.back()} className="mt-8 flex items-center justify-center gap-2 text-slate-300 font-black text-[9px] uppercase tracking-widest hover:text-slate-500 transition-colors w-full">
          <ChevronLeft size={14} /> Назад
        </button>
      </motion.div>
    </div>
  )
}