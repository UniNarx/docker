'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  ChevronLeft, 
  Clock, 
  Edit3, 
  Activity,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react'

// --- Types ---
type PatientData = {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
};

type MedicalRecordData = {
  _id: string;
  visitDate: string;
  notes?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans",
  container: "max-w-4xl mx-auto",
  
  // Patient Header Card
  profileCard: "bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-indigo-900/5 p-8 mb-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden",
  avatarLarge: "w-24 h-24 bg-indigo-50 rounded-[35px] flex items-center justify-center text-indigo-500 shrink-0",
  
  // Timeline Styles
  timelineContainer: "relative border-l-2 border-slate-100 ml-4 md:ml-8 pl-8 space-y-10",
  timelineDot: "absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 border-[#f8fafc] bg-indigo-500 shadow-sm",
  recordCard: "bg-white rounded-[30px] border-2 border-slate-50 p-6 shadow-sm hover:shadow-md transition-shadow group relative",
  
  // Typography
  patientName: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  sectionTitle: "text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3",
  
  // Buttons
  btnBack: "flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-8",
  btnAdd: "bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2",
  btnEdit: "opacity-0 group-hover:opacity-100 absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
};

export default function DoctorViewPatientPage() {
  const params = useParams();
  const patientIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientIdParam) return;

    const loadData = async () => {
      try {
        const [patient, records] = await Promise.all([
          apiFetch<PatientData>(`/patients/${patientIdParam}`),
          apiFetch<MedicalRecordData[]>(`/patients/${patientIdParam}/medical-records`)
        ]);
        setPatientData(patient);
        setMedicalRecords(records || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientIdParam]);

  const handleCreateRecord = async () => {
    const date = prompt('Дата (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    const notes = prompt('Заметки по осмотру:');
    
    try {
      const newRec = await apiFetch<MedicalRecordData>('/medical-records', {
        method: 'POST',
        body: JSON.stringify({ patientId: patientIdParam, visitDate: date, notes })
      });
      setMedicalRecords(prev => prev ? [newRec, ...prev] : [newRec]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <button onClick={() => router.back()} className={styles.btnBack}>
          <ArrowLeft size={14} strokeWidth={3} /> Вернуться в картотеку
        </button>

        {/* --- Header Profile --- */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.profileCard}
        >
          <div className={styles.avatarLarge}>
            <User size={48} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className={styles.patientName}>{patientData?.firstName} {patientData?.lastName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Calendar size={14} className="text-indigo-400" />
                Родился: {new Date(patientData?.dateOfBirth || '').toLocaleDateString('ru-RU')}
              </span>
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Activity size={14} className="text-emerald-400" />
                ID: {patientIdParam?.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={handleCreateRecord} className={styles.btnAdd}>
            <Plus size={18} /> Новая запись
          </button>
        </motion.div>

        {/* --- Medical History Timeline --- */}
        <div className="px-4">
          <h2 className={styles.sectionTitle}>
            <FileText size={14} /> История посещений
          </h2>

          <div className={styles.timelineContainer}>
            <AnimatePresence>
              {medicalRecords && medicalRecords.length > 0 ? (
                medicalRecords.map((record, index) => (
                  <motion.div
                    key={record._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={styles.recordCard}
                  >
                    <div className={styles.timelineDot} />
                    
                    <div className="flex items-center gap-2 text-indigo-500 mb-3">
                      <Clock size={14} />
                      <span className="text-xs font-black uppercase tracking-widest">
                        {new Date(record.visitDate).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-[#1e3a8a] leading-relaxed pr-10">
                      {record.notes || <span className="text-slate-300 italic">Заметки отсутствуют</span>}
                    </p>

                    <Link href={`/dashboard/doctors/patients/${patientIdParam}/medical-records/${record._id}/edit`}>
                      <button className={styles.btnEdit}>
                        <Edit3 size={18} />
                      </button>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">История болезни пуста</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}