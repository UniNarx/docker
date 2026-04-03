'use client'

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Stethoscope, 
  ChevronLeft, 
  Save, 
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

// --- Types ---
type AppointmentData = {
  _id: string;
  doctorId: string;
  patientId: string;
  apptTime: string;
  status?: string;
};

type SelectOption = { value: string; label: string; };
type ApiInfo = { _id: string; firstName: string; lastName: string; };

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-xl w-full bg-white rounded-[45px] shadow-2xl shadow-blue-900/5 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  // Custom Select & Input
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1e3a8a] transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-[#1e3a8a]/20 focus:bg-white transition-all appearance-none",
  
  // Buttons
  btnSave: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-[#1e3a8a] transition-colors mt-8 w-full",
  
  errorBox: "bg-red-50 border-2 border-red-100 p-4 rounded-[20px] flex items-start gap-3 text-red-500 text-[11px] font-bold uppercase tracking-tight mb-6"
};

export default function EditAppointmentPage() {
  const params = useParams();
  const apptIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [doctorOptions, setDoctorOptions] = useState<SelectOption[]>([]);
  const [patientOptions, setPatientOptions] = useState<SelectOption[]>([]);
  
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!apptIdParam) return;
    
    setIsLoading(true);
    Promise.all([
      apiFetch<AppointmentData>(`/appointments/${apptIdParam}`),
      apiFetch<ApiInfo[]>('/doctors'),
      apiFetch<ApiInfo[]>('/patients'),
    ])
      .then(([appt, docs, pats]) => {
        setSelectedDoctorId(appt.doctorId);
        setSelectedPatientId(appt.patientId);
        
        const dt = new Date(appt.apptTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setAppointmentTime(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`);

        setDoctorOptions(docs.map(d => ({ value: d._id, label: `Д-р ${d.firstName} ${d.lastName}` })));
        setPatientOptions(pats.map(p => ({ value: p._id, label: `${p.firstName} ${p.lastName}` })));
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [apptIdParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await apiFetch(`/appointments/${apptIdParam}`, {
        method: 'PUT',
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
      <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center text-[#1e3a8a] mx-auto mb-6">
            <Calendar size={32} />
          </div>
          <h1 className={styles.title}>Редактирование</h1>
          <p className={styles.subtitle}>ID Записи: {apptIdParam?.slice(-8)}</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Поле: Доктор */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Stethoscope size={12} /> Назначенный врач
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><User size={20} /></div>
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

          {/* Поле: Пациент */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <User size={12} /> Пациент
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><UsersIcon size={20} /></div>
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

          {/* Поле: Дата/Время */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Clock size={12} /> Время приема
            </label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Calendar size={20} /></div>
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
            className={styles.btnSave}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><Save size={18} /> Обновить данные</>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Вернуться назад
        </button>
      </motion.div>
    </div>
  );
}

// Вспомогательная иконка для пациентов
function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}