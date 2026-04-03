'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Trash2, 
  Calendar, 
  Clock, 
  Fingerprint, 
  Search,
  ChevronRight 
} from 'lucide-react'

const styles = {
  layout: "min-h-screen bg-[#f8fafc] px-4 pb-20 pt-12 font-sans",
  container: "max-w-5xl mx-auto",
  
  // Header
  header: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
  title: "text-5xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  subtitle: "text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-2 block",
  
  // Список карточек
  list: "space-y-4",
  card: "group relative bg-white/70 backdrop-blur-xl border-2 border-white rounded-[35px] p-6 shadow-xl shadow-black/5 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 hover:border-[#1e3a8a]/10 hover:shadow-2xl hover:shadow-[#1e3a8a]/5",
  
  // Инфо
  avatar: "w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[#1e3a8a] shrink-0",
  name: "text-xl font-black text-[#1e3a8a] leading-tight uppercase tracking-tighter",
  idBadge: "px-2 py-1 bg-slate-100 text-slate-400 rounded-md text-[8px] font-mono mb-1 inline-block",
  
  // Сетка данных
  infoGrid: "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2",
  metaItem: "flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider",
  metaValue: "text-[#1e3a8a] font-black",

  // Действия
  actions: "flex items-center gap-2 md:ml-auto",
  btnDelete: "p-4 bg-red-50/50 border-2 border-red-50 text-red-400 rounded-[22px] hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-90",
  
  emptyState: "text-center py-20 bg-white/40 rounded-[45px] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-xs tracking-widest",
  loadingSpinner: "w-10 h-10 border-4 border-[#1e3a8a]/10 border-t-[#1e3a8a] rounded-full animate-spin"
};

type PatientData = {
  id?: string;
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  createdAt: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Модалка удаления
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    setIsLoading(true);
    apiFetch<PatientData[]>('/patients')
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      await apiFetch<void>(`/patients/${patientId}`, { method: 'DELETE' });
      setPatients(prev => prev.filter(p => (p._id || p.id) !== patientId));
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
       <div className={styles.loadingSpinner} />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <span className={styles.subtitle}>База данных</span>
            <h1 className={styles.title}>Пациенты</h1>
          </div>
          <div className="flex gap-2">
            <div className="hidden md:flex items-center bg-white border-2 border-white shadow-sm rounded-full px-4 py-2">
               <Search size={16} className="text-slate-300 mr-2" />
               <input type="text" placeholder="Поиск..." className="bg-transparent outline-none text-xs font-bold text-[#1e3a8a] placeholder:text-slate-300 w-40" />
            </div>
          </div>
        </header>

        {error && (
          <div className="p-6 mb-8 bg-red-50 border-2 border-red-100 rounded-[30px] text-red-600 text-xs font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <div className={styles.list}>
          {patients.length === 0 ? (
            <div className={styles.emptyState}>Список пациентов пуст</div>
          ) : (
            <AnimatePresence>
              {patients.map((p, idx) => {
                const patientId = p._id || p.id || "";
                return (
                  <motion.div
                    key={patientId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                    className={styles.card}
                  >
                    {/* Аватар */}
                    <div className={styles.avatar}>
                      <User size={24} strokeWidth={2.5} />
                    </div>

                    {/* Основная инфо */}
                    <div className="flex-1">
                      <span className={styles.idBadge}>ID: {patientId.slice(-6)}</span>
                      <h3 className={styles.name}>{p.firstName} {p.lastName}</h3>
                      
                      <div className={styles.infoGrid}>
                        <div className={styles.metaItem}>
                          <Calendar size={12} strokeWidth={2.5} />
                          ДР: <span className={styles.metaValue}>{new Date(p.dateOfBirth).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Clock size={12} strokeWidth={2.5} />
                          Регистрация: <span className={styles.metaValue}>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className={styles.actions}>
                      <button 
                        className={styles.btnDelete}
                        onClick={() => setDeleteConfirm({ isOpen: true, id: patientId })}
                      >
                        <Trash2 size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-sm p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[45px] p-10 max-w-sm w-full text-center shadow-2xl border-4 border-white"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <Fingerprint size={32} />
            </div>
            <h2 className="text-xl font-black text-[#1e3a8a] uppercase tracking-tighter mb-2">Удалить профиль?</h2>
            <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest leading-tight px-4">Все данные пациента будут стерты без возможности восстановления</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => deleteConfirm.id && handleDeletePatient(deleteConfirm.id)}
                className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >
                Удалить навсегда
              </button>
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}