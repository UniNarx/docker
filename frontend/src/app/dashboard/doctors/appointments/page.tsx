'use client'

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES
} from '@/lib/authUtils';

// --- Types ---
type PatientInfo = {
  _id: string;
  firstName: string;
  lastName: string;
};

type AppointmentData = {
  _id: string;
  patient: PatientInfo;
  apptTime: string;
  status: 'scheduled' | 'cancelled' | 'completed' | string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans",
  container: "max-w-5xl mx-auto",
  header: "flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4",
  title: "text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mt-1",
  
  // Table / List Styles
  card: "bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border-4 border-white overflow-hidden",
  table: "w-full text-left border-collapse",
  th: "px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50",
  tr: "group hover:bg-slate-50/50 transition-colors",
  td: "px-8 py-6 border-b border-slate-50",
  
  // Status Badges
  badge: "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2",
  statusScheduled: "bg-blue-50 text-blue-600",
  statusCompleted: "bg-emerald-50 text-emerald-600",
  statusCancelled: "bg-red-50 text-red-600",

  // Action Buttons
  btnAction: "p-2 rounded-xl transition-all active:scale-90 flex items-center justify-center",
  btnComplete: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
  btnCancel: "bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100",
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getTokenFromStorage();
    const decodedToken = token ? getDecodedToken(token) : null;

    if (!token || decodedToken?.roleName !== ROLE_NAMES.DOCTOR) {
      setError('Доступ ограничен');
      setIsLoading(false);
      return;
    }

    apiFetch<AppointmentData[]>('/appointments/doctor/me')
      .then(data => setAppointments(data || []))
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'cancelled' | 'completed') => {
    const confirmMsg = newStatus === 'cancelled' ? 'Отменить запись?' : 'Приём завершен?';
    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments(prev => prev?.map(a => a._id === id ? { ...a, status: newStatus } : a) || null);
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={styles.title}>Приёмы</h1>
            <span className={styles.subtitle}>Расписание консультаций на сегодня</span>
          </motion.div>
          
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl shadow-sm border border-slate-100">
            <Calendar className="text-blue-500" size={18} />
            <span className="text-sm font-bold text-[#1e3a8a]">
              {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        {error ? (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] flex items-center gap-4 text-red-500 font-bold">
            <AlertCircle /> {error}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.card}
          >
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Время</th>
                    <th className={styles.th}>Пациент</th>
                    <th className={styles.th}>Статус</th>
                    <th className={`${styles.th} text-right`}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {appointments?.map((appt) => (
                      <motion.tr 
                        key={appt._id} 
                        layout
                        className={styles.tr}
                      >
                        {/* Время */}
                        <td className={styles.td}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                              <Clock size={18} />
                            </div>
                            <span className="text-sm font-black text-[#1e3a8a]">
                              {new Date(appt.apptTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        {/* Пациент */}
                        <td className={styles.td}>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[#1e3a8a]">
                              {appt.patient.firstName} {appt.patient.lastName}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Пациент клиники</span>
                          </div>
                        </td>

                        {/* Статус */}
                        <td className={styles.td}>
                          <span className={`
                            ${styles.badge} 
                            ${appt.status === 'scheduled' ? styles.statusScheduled : 
                              appt.status === 'completed' ? styles.statusCompleted : styles.statusCancelled}
                          `}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                            {appt.status === 'scheduled' ? 'Ожидается' : 
                             appt.status === 'completed' ? 'Завершен' : 'Отменен'}
                          </span>
                        </td>

                        {/* Действия */}
                        <td className={`${styles.td} text-right`}>
                          <div className="flex items-center justify-end gap-2">
                            {appt.status === 'scheduled' ? (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(appt._id, 'cancelled')}
                                  className={`${styles.btnAction} ${styles.btnCancel}`}
                                  title="Отменить"
                                >
                                  <XCircle size={20} />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(appt._id, 'completed')}
                                  className={`${styles.btnAction} ${styles.btnComplete}`}
                                >
                                  <CheckCircle2 size={18} className="mr-2" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Завершить</span>
                                </button>
                              </>
                            ) : (
                              <div className="text-slate-300">
                                <ChevronRight size={20} />
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            
            {appointments?.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <Calendar size={40} />
                </div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">На сегодня приёмов нет</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}