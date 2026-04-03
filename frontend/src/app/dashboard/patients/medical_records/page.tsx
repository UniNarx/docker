'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Calendar, 
  User, 
  Stethoscope, 
  Search, 
  Download, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  ClipboardList
} from 'lucide-react'

// --- Types ---
type EmbeddedDoctorInfo = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
};

type MedicalRecordEntry = {
  _id: string;
  visitDate: string;
  notes: string;
  attachments?: string[];
  doctor: EmbeddedDoctorInfo;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans",
  container: "max-w-4xl mx-auto",
  header: "mb-12",
  title: "text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  // Card Style
  recordCard: "bg-white rounded-[35px] border-4 border-white shadow-xl shadow-slate-900/5 overflow-hidden mb-6 group hover:shadow-2xl hover:shadow-indigo-900/10 transition-all",
  cardHeader: "bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4",
  dateBadge: "inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest",
  doctorInfo: "flex items-center gap-3 text-slate-500",
  
  cardBody: "p-8",
  notesTitle: "text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2",
  notesText: "text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap",
  
  emptyState: "text-center py-24 bg-white rounded-[45px] border-4 border-dashed border-slate-100",
  loadingWrapper: "min-h-[400px] flex items-center justify-center"
};

export default function MyMedicalRecordsPage() {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const patientProfile = await apiFetch<{_id: string}>('/patients/me');
        const records = await apiFetch<MedicalRecordEntry[]>(`/patients/${patientProfile._id}/medical-records`);
        // Сортируем: свежие записи сверху
        const sorted = (records || []).sort((a, b) => 
          new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        );
        setMedicalRecords(sorted);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return (
    <div className={styles.loadingWrapper}>
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        {/* Header Section */}
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className={styles.title}>Медкарта</h1>
            <p className={styles.subtitle}>Полная история ваших клинических записей</p>
          </motion.div>
        </header>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] text-red-500 font-bold flex items-center gap-4 mb-10">
            <AlertCircle /> {error}
          </div>
        )}

        {/* Records List */}
        {!medicalRecords || medicalRecords.length === 0 ? (
          <div className={styles.emptyState}>
            <div className="w-20 h-20 bg-slate-50 rounded-[25px] flex items-center justify-center mx-auto mb-6 text-slate-200">
              <ClipboardList size={40} />
            </div>
            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">История пуста</p>
          </div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {medicalRecords.map((record, index) => (
                <motion.div
                  key={record._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={styles.recordCard}
                >
                  {/* Card Header: Мета-данные */}
                  <div className={styles.cardHeader}>
                    <div className="flex items-center gap-4">
                      <div className={styles.dateBadge}>
                        <Calendar size={12} strokeWidth={3} />
                        {new Date(record.visitDate).toLocaleDateString('ru-RU', { 
                          day: 'numeric', month: 'long', year: 'numeric' 
                        })}
                      </div>
                      <div className="h-4 w-[2px] bg-slate-200 hidden md:block" />
                      <div className={styles.doctorInfo}>
                        <Stethoscope size={16} className="text-indigo-400" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#1e3a8a]">
                          {record.doctor ? `д-р ${record.doctor.lastName}` : 'Врач не указан'}
                        </span>
                      </div>
                    </div>
                    
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                      <Download size={18} />
                    </button>
                  </div>

                  {/* Card Body: Само заключение */}
                  <div className={styles.cardBody}>
                    <div className={styles.notesTitle}>
                      <FileText size={12} /> Клиническое заключение
                    </div>
                    <div className={styles.notesText}>
                      {record.notes || "Детали визита не зафиксированы."}
                    </div>

                    {/* Поле для вложений (заглушка) */}
                    {record.attachments && record.attachments.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap gap-3">
                        {record.attachments.map((_, i) => (
                          <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 border border-slate-100">
                            <FileText size={12} /> Приложение_{i+1}.pdf
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <footer className="mt-16 text-center border-t border-slate-100 pt-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <Clock size={12} /> Последнее обновление: {new Date().toLocaleDateString()}
          </div>
        </footer>
      </div>
    </div>
  )
}