"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  User, 
  Edit2, 
  Trash2, 
  Calendar, 
  Stethoscope, 
  ChevronRight,
  Search
} from "lucide-react";

// Предполагаем, что ConfirmModal лежит тут (из вашего первого примера)
// import ConfirmModal from "@/components/ConfirmModal"; 

const styles = {
  layout: "min-h-screen bg-[#f8fafc] px-4 pb-20 pt-12 font-sans",
  container: "max-w-5xl mx-auto",
  
  // Header
  header: "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
  title: "text-5xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  subtitle: "text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-2 block",
  
  // Кнопка добавления
  btnAdd: "flex items-center gap-2 px-8 py-4 bg-[#1e3a8a] text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#1e3a8a]/20 hover:scale-105 active:scale-95 transition-all",
  
  // Сетка/Список
  list: "space-y-4",
  card: "group relative bg-white/70 backdrop-blur-xl border-2 border-white rounded-[35px] p-5 shadow-xl shadow-black/5 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 hover:border-[#1e3a8a]/10 hover:shadow-2xl hover:shadow-[#1e3a8a]/5",
  
  // Инфо о враче
  avatar: "w-16 h-16 bg-slate-100 rounded-[22px] flex items-center justify-center text-[#1e3a8a] shrink-0",
  name: "text-xl font-black text-[#1e3a8a] leading-tight uppercase tracking-tighter",
  specBadge: "inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1e3a8a] rounded-full text-[9px] font-black uppercase tracking-widest mt-1",
  
  // Мета-данные
  metaItem: "flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider",
  idBadge: "px-2 py-1 bg-slate-100 text-slate-400 rounded-md text-[8px] font-mono",

  // Кнопки действий
  actions: "flex items-center gap-2 md:ml-auto",
  btnEdit: "p-3.5 bg-white border-2 border-slate-50 text-slate-600 rounded-[18px] hover:text-[#1e3a8a] hover:border-[#1e3a8a]/20 hover:shadow-lg transition-all active:scale-90",
  btnDelete: "p-3.5 bg-red-50/50 border-2 border-red-50 text-red-400 rounded-[18px] hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-90",
  
  emptyState: "text-center py-20 bg-white/40 rounded-[45px] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-xs tracking-widest"
};

type DoctorData = {
  id?: number;
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  createdAt: string;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Состояние для модалки удаления (как в вашем первом примере)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = () => {
    setIsLoading(true);
    apiFetch<DoctorData[]>("/doctors")
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      await apiFetch<void>(`/doctors/${doctorId}`, { method: "DELETE" });
      setDoctors(prev => prev.filter(doc => (doc._id || doc.id?.toString()) !== doctorId));
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      alert("Ошибка при удалении: " + err.message);
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
            <span className={styles.subtitle}>Панель управления</span>
            <h1 className={styles.title}>Врачи</h1>
          </div>
          <Link href="/dashboard/doctors/create">
            <button className={styles.btnAdd}>
              <Plus size={18} strokeWidth={3} />
              Добавить врача
            </button>
          </Link>
        </header>

        {error && (
          <div className="p-6 mb-8 bg-red-50 border-2 border-red-100 rounded-[30px] text-red-600 text-xs font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <div className={styles.list}>
          {doctors.length === 0 ? (
            <div className={styles.emptyState}>Список врачей пуст</div>
          ) : (
            <AnimatePresence>
              {doctors.map((doctor, idx) => {
                const doctorId = doctor._id || doctor.id?.toString() || "";
                return (
                  <motion.div
                    key={doctorId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={styles.card}
                  >
                    {/* Аватар/Иконка */}
                    <div className={styles.avatar}>
                      <User size={28} strokeWidth={1.5} />
                    </div>

                    {/* Основная инфо */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={styles.name}>{doctor.firstName} {doctor.lastName}</h3>
                        <span className={styles.idBadge}>#{doctorId.slice(-4)}</span>
                      </div>
                      <div className={styles.specBadge}>
                        <Stethoscope size={10} strokeWidth={3} />
                        {doctor.specialty}
                      </div>
                    </div>

                    {/* Дата создания */}
                    <div className="hidden lg:block">
                      <div className={styles.metaItem}>
                        <Calendar size={12} strokeWidth={2.5} />
                        Добавлен: {new Date(doctor.createdAt).toLocaleDateString("ru-RU")}
                      </div>
                    </div>

                    {/* Действия */}
                    <div className={styles.actions}>
                      <Link href={`/dashboard/doctors/${doctorId}/edit`}>
                        <button className={styles.btnEdit} title="Редактировать">
                          <Edit2 size={18} strokeWidth={2.5} />
                        </button>
                      </Link>
                      <button 
                        className={styles.btnDelete} 
                        onClick={() => setDeleteConfirm({ isOpen: true, id: doctorId })}
                        title="Удалить"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Интеграция ConfirmModal (если вы его используете) 
          Если модалки нет, можно оставить стандартный confirm, но лучше сделать свою в этом стиле
      */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0f172a]/70 backdrop-blur-sm p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h2 className="text-xl font-black text-[#1e3a8a] uppercase tracking-tighter mb-2">Удалить врача?</h2>
            <p className="text-slate-400 text-sm font-bold mb-8 uppercase tracking-widest leading-tight">Это действие невозможно отменить</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => deleteConfirm.id && handleDeleteDoctor(deleteConfirm.id)}
                className="w-full py-4 bg-red-500 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/20"
              >
                Подтвердить удаление
              </button>
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em]"
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