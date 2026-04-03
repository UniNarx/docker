'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  User, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  CheckCircle2,
  Timer
} from 'lucide-react'

// --- Types ---
type DoctorInfoForAppointment = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
};

type AppointmentData = {
  _id: string;
  id?: string;
  apptTime: string;
  status: string;
  doctor: DoctorInfoForAppointment;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans",
  container: "max-w-4xl mx-auto",
  header: "mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6",
  title: "text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2",
  
  grid: "grid grid-cols-1 gap-4",
  card: "bg-white rounded-[32px] border-4 border-white shadow-xl shadow-slate-900/5 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:scale-[1.01] transition-all relative overflow-hidden group",
  
  dateBox: "flex flex-col items-center justify-center bg-slate-50 rounded-[24px] w-full md:w-32 h-32 border-2 border-slate-100 shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors",
  day: "text-3xl font-black text-[#1e3a8a]",
  month: "text-[10px] font-black text-slate-400 uppercase tracking-widest",
  
  info: "flex-grow space-y-2",
  doctorName: "text-xl font-bold text-[#1e3a8a] flex items-center gap-2",
  specialty: "inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest",
  time: "flex items-center gap-2 text-slate-400 text-sm font-bold",
  
  statusBadge: "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 self-start md:self-center",
  
  emptyState: "text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100",
};

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
    case 'planned':
      return "bg-blue-50 text-blue-600";
    case 'completed':
      return "bg-emerald-50 text-emerald-600";
    case 'cancelled':
      return "bg-red-50 text-red-600";
    default:
      return "bg-slate-50 text-slate-500";
  }
};

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<AppointmentData[]>(`/appointments/my`)
      .then(data => setAppointments(data || []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        {/* Header */}
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className={styles.title}>Мои визиты</h1>
            <p className={styles.subtitle}>График приёмов и история посещений</p>
          </motion.div>
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border-2 border-slate-50 flex items-center justify-center text-indigo-500">
            <Calendar size={24} />
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[28px] text-red-500 font-bold flex items-center gap-4 mb-8">
            <AlertCircle /> {error}
          </div>
        )}

        {/* Content */}
        {!appointments || appointments.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyState}>
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <Calendar size={40} />
            </div>
            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">У вас пока нет записей</p>
          </motion.div>
        ) : (
          <div className={styles.grid}>
            <AnimatePresence>
              {appointments.map((appt, index) => {
                const date = new Date(appt.apptTime);
                const day = date.getDate();
                const month = date.toLocaleString('ru-RU', { month: 'short' });
                const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

                return (
                  <motion.div
                    key={appt._id || appt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={styles.card}
                  >
                    {/* Date Block */}
                    <div className={styles.dateBox}>
                      <span className={styles.day}>{day}</span>
                      <span className={styles.month}>{month}</span>
                    </div>

                    {/* Main Info */}
                    <div className={styles.info}>
                      <div className={styles.specialty}>
                        <Stethoscope size={10} /> {appt.doctor?.specialty || 'Общий профиль'}
                      </div>
                      <h3 className={styles.doctorName}>
                        <User size={20} className="text-slate-300" />
                        {appt.doctor ? `д-р ${appt.doctor.lastName} ${appt.doctor.firstName}` : 'Врач не назначен'}
                      </h3>
                      <div className={styles.time}>
                        <Clock size={16} className="text-indigo-400" />
                        Начало в {time}
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex flex-col items-end gap-3">
                      <div className={`${styles.statusBadge} ${getStatusStyles(appt.status)}`}>
                        {appt.status.toLowerCase() === 'completed' ? <CheckCircle2 size={12} /> : <Timer size={12} />}
                        {appt.status}
                      </div>
                      <button className="p-2 text-slate-200 hover:text-indigo-500 transition-colors hidden md:block">
                        <ChevronRight size={24} />
                      </button>
                    </div>

                    {/* Decorative Background Icon */}
                    <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-indigo-50/50 transition-colors pointer-events-none">
                      <Stethoscope size={100} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Приходите за 10 минут до начала приёма
          </p>
        </footer>
      </div>
    </div>
  );
}