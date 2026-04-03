'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES,
    RoleName
} from '@/lib/authUtils';

const styles = {
  layout: "min-h-screen bg-[#f8fafc] px-4 pb-20 pt-12 font-sans",
  container: "max-w-5xl mx-auto",
  
  // Header
  header: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
  title: "text-5xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  subtitle: "text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-2 block",
  
  // Кнопка добавления
  btnAdd: "flex items-center gap-2 px-8 py-4 bg-[#1e3a8a] text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#1e3a8a]/20 hover:scale-105 active:scale-95 transition-all",
  
  // Карточки приёмов
  list: "grid grid-cols-1 gap-4",
  card: "group relative bg-white/70 backdrop-blur-xl border-2 border-white rounded-[40px] p-6 shadow-xl shadow-black/5 flex flex-col lg:flex-row lg:items-center gap-6 transition-all duration-300 hover:border-[#1e3a8a]/10 hover:shadow-2xl",
  
  // Секция времени (Визуальный акцент слева)
  timeBlock: "flex flex-row lg:flex-col items-center justify-center bg-[#1e3a8a]/5 rounded-[30px] p-4 lg:w-32 lg:h-32 shrink-0 border border-[#1e3a8a]/5",
  dateText: "text-[#1e3a8a] font-black text-lg leading-none",
  monthText: "text-[#1e3a8a]/50 font-black text-[10px] uppercase tracking-widest mt-1",
  timeText: "text-[#1e3a8a] font-black text-sm mt-auto bg-white px-3 py-1 rounded-full shadow-sm lg:mt-2",

  // Основная инфо
  infoSection: "flex-1 grid grid-cols-1 md:grid-cols-2 gap-6",
  personBlock: "flex items-start gap-4",
  iconWrapper: "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
  label: "text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1",
  name: "text-md font-black text-[#1e3a8a] uppercase tracking-tight leading-tight",
  
  // Статусы
  statusBadge: (status: string) => {
    const base = "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ";
    switch (status?.toLowerCase()) {
      case 'confirmed': return base + "bg-blue-50 border-blue-100 text-blue-600";
      case 'pending': return base + "bg-orange-50 border-orange-100 text-orange-600";
      case 'cancelled': return base + "bg-red-50 border-red-100 text-red-600";
      default: return base + "bg-slate-50 border-slate-100 text-slate-500";
    }
  },

  // Действия
  actions: "flex items-center gap-2 lg:ml-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-50",
  btnEdit: "p-3.5 bg-white border-2 border-slate-50 text-slate-600 rounded-[18px] hover:text-[#1e3a8a] hover:border-[#1e3a8a]/20 hover:shadow-lg transition-all active:scale-90",
  btnDelete: "p-3.5 bg-red-50/50 border-2 border-red-50 text-red-400 rounded-[18px] hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg transition-all active:scale-90",
};

// Types
type AppointmentData = {
  _id: string; id?: string;
  doctorId: string; patientId: string;
  apptTime: string; status: string;
  doctor?: { firstName: string; lastName: string; };
  patient?: { firstName: string; lastName: string; };
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    const token = getTokenFromStorage();
    const decodedToken = getDecodedToken(token);
    const role = decodedToken?.roleName as RoleName;

    if (role !== ROLE_NAMES.ADMIN && role !== ROLE_NAMES.SUPERADMIN) {
      setError("Доступ запрещен. Только для администрации.");
      setIsLoading(false);
      return;
    }

    apiFetch<AppointmentData[]>('/appointments/all-for-admin')
      .then(data => setAppointments(data || []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
      setAppointments(prev => prev.filter(a => (a._id || a.id) !== id));
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
       <div className="w-10 h-10 border-4 border-[#1e3a8a]/10 border-t-[#1e3a8a] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <span className={styles.subtitle}>График клиники</span>
            <h1 className={styles.title}>Приёмы</h1>
          </div>
          <Link href="/dashboard/appointments/create">
            <button className={styles.btnAdd}>
              <Plus size={18} strokeWidth={3} />
              Новая запись
            </button>
          </Link>
        </header>

        {error ? (
          <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[40px] text-red-600 text-center font-black uppercase text-[10px] tracking-widest">
            {error}
          </div>
        ) : (
          <div className={styles.list}>
            <AnimatePresence>
              {appointments.map((appt, idx) => {
                const apptId = appt._id || appt.id || "";
                const dateObj = new Date(appt.apptTime);
                
                return (
                  <motion.div
                    key={apptId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={styles.card}
                  >
                    {/* Время приема */}
                    <div className={styles.timeBlock}>
                      <span className={styles.dateText}>
                        {dateObj.getDate()}
                      </span>
                      <span className={styles.monthText}>
                        {dateObj.toLocaleString('ru-RU', { month: 'short' })}
                      </span>
                      <div className={styles.timeText}>
                        {dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Информация */}
                    <div className={styles.infoSection}>
                      {/* Доктор */}
                      <div className={styles.personBlock}>
                        <div className={`${styles.iconWrapper} bg-blue-50 text-blue-500`}>
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <p className={styles.label}>Доктор</p>
                          <h4 className={styles.name}>
                            {appt.doctor ? `${appt.doctor.firstName} ${appt.doctor.lastName}` : "Врач не указан"}
                          </h4>
                        </div>
                      </div>

                      {/* Пациент */}
                      <div className={styles.personBlock}>
                        <div className={`${styles.iconWrapper} bg-slate-50 text-slate-500`}>
                          <User size={20} />
                        </div>
                        <div>
                          <p className={styles.label}>Пациент</p>
                          <h4 className={styles.name}>
                            {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : "Пациент не указан"}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Статус и Действия */}
                    <div className="flex flex-col lg:items-end gap-4 lg:ml-auto">
                      <span className={styles.statusBadge(appt.status)}>
                        {appt.status}
                      </span>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/appointments/${apptId}/edit`}>
                          <button className={styles.btnEdit}><Edit2 size={16} strokeWidth={2.5} /></button>
                        </Link>
                        <button 
                          className={styles.btnDelete}
                          onClick={() => setDeleteConfirm({ isOpen: true, id: apptId })}
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {appointments.length === 0 && (
              <div className="text-center py-20 bg-white/40 rounded-[45px] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-xs tracking-widest">
                Записей на приём пока нет
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-sm p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[45px] p-10 max-w-sm w-full text-center border-4 border-white">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
            <h2 className="text-xl font-black text-[#1e3a8a] uppercase tracking-tighter mb-2">Отменить запись?</h2>
            <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest leading-tight">Удаление записи приведет к освобождению слота доктора.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => deleteConfirm.id && handleDelete(deleteConfirm.id)} className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em]">Подтвердить удаление</button>
              <button onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em]">Закрыть</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}