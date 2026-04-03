'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  CalendarPlus, 
  User, 
  Stethoscope, 
  ChevronLeft, 
  PlusCircle, 
  Clock,
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react';

// --- Types ---
type SelectOption = { value: string; label: string; };
type ApiNameRecord = { _id: string; firstName: string; lastName: string; };

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-xl w-full bg-white rounded-[45px] shadow-2xl shadow-teal-900/5 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#134e4a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#134e4a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#134e4a] outline-none focus:border-teal-500/20 focus:bg-white transition-all appearance-none disabled:opacity-50",
  
  btnCreate: "w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-teal-600 transition-colors mt-8 w-full",
  
  errorBox: "bg-red-50 border-2 border-red-100 p-4 rounded-[20px] flex items-start gap-3 text-red-500 text-[11px] font-bold uppercase tracking-tight mb-6"
};

export default function AppointmentCreatePage() {
  const router = useRouter();

  const [doctorOptions, setDoctorOptions] = useState<SelectOption[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      apiFetch<ApiNameRecord[]>('/doctors'),
      apiFetch<ApiNameRecord[]>('/patients'),
    ])
    .then(([docs, pats]) => {
      setDoctorOptions(docs.map(d => ({ value: d._id, label: `Д-р ${d.firstName} ${d.lastName}` })));
      setPatientOptions(pats.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName}` })));
    })
    .catch(err => setError(err.message))
    .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedPatientId || !appointmentTime) {
      setError("Заполните все обязательные поля");
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          patientId: selectedPatientId,
          apptTime: new Date(appointmentTime).toISOString(),
        }),
      });
      router.push('/dashboard/appointments');
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className="w-16 h-16 bg-teal-50 rounded-[22px] flex items-center justify-center text-teal-600 mx-auto mb-6">
            <CalendarPlus size={32} />
          </div>
          <h1 className={styles.title}>Новый приём</h1>
          <p className={styles.subtitle}>Резервирование времени в графике</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Доктор */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Stethoscope size={12} /> Выбор специалиста
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Stethoscope size={20} /></div>
              <select
                className={styles.input}
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                required
              >
                <option value="">Выберите врача...</option>
                {doctorOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* Пациент */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <User size={12} /> Данные пациента
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Users size={20} /></div>
              <select
                className={styles.input}
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                required
              >
                <option value="">Выберите пациента...</option>
                {patientOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Дата/Время */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Clock size={12} /> Желаемое время
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Clock size={20} /></div>
              <input
                type="datetime-local"
                className={styles.input}
                value={appointmentTime}
                onChange={e => setAppointmentTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={styles.btnCreate}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><PlusCircle size={18} /> Создать запись</>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Отмена и выход
        </button>
      </motion.div>
    </div>
  );
}