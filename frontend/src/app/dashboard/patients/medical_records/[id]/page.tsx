'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Calendar, 
  ChevronLeft, 
  Clock, 
  Printer, 
  Share2,
  Loader2,
  AlertCircle,
  Stethoscope,
  Fingerprint
} from 'lucide-react'

type MedicalRecord = {
  id: number
  patient_id: number
  doctor_id: number
  visit_date: string
  notes: string
  attachments: string[]
  created_at: string
}

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans flex flex-col items-center",
  container: "max-w-2xl w-full",
  
  // Paper style card
  paper: "bg-white rounded-[40px] shadow-2xl shadow-slate-900/5 border-4 border-white p-8 md:p-14 relative overflow-hidden",
  
  // Header section
  header: "border-b-2 border-slate-50 pb-10 mb-10 flex justify-between items-start",
  badge: "px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none",
  
  // Meta info rows
  metaGrid: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-12",
  metaItem: "flex items-center gap-4",
  metaIcon: "w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100",
  metaLabel: "text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5",
  metaValue: "text-sm font-bold text-[#1e3a8a]",

  // Notes area
  contentArea: "bg-slate-50/50 rounded-[32px] p-8 md:p-10 border-2 border-slate-50",
  contentLabel: "text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2",
  notesText: "text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap",
  
  // Footer buttons
  actions: "flex items-center justify-between mt-10 px-4",
  btnBack: "flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors",
  toolBtn: "w-10 h-10 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-100 transition-all shadow-sm"
};

export default function MedicalRecordPage() {
  const { id } = useParams()
  const mrId = Number(id)
  const router = useRouter()

  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    apiFetch<MedicalRecord>(`/medical-records/${mrId}`)
      .then(setRecord)
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false))
  }, [mrId])

  if (isLoading) return (
    <div className={styles.layout}>
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mt-20" />
    </div>
  )

  if (error) return (
    <div className={styles.layout}>
      <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[35px] text-red-500 flex flex-col items-center gap-4">
        <AlertCircle size={40} />
        <p className="font-black text-[11px] uppercase tracking-widest text-center">Ошибка доступа к протоколу: {error}</p>
        <button onClick={() => router.back()} className="text-red-400 underline text-[10px] font-bold">Вернуться назад</button>
      </div>
    </div>
  )

  if (!record) return null

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.paper}
        >
          {/* Header */}
          <div className={styles.header}>
            <div>
              <div className={styles.badge}>
                <Fingerprint size={12} /> Record ID: {record.id}
              </div>
              <h1 className={styles.title}>Протокол осмотра</h1>
            </div>
            <div className="flex gap-2">
              <button className={styles.toolBtn} title="Печать"><Printer size={18} /></button>
              <button className={styles.toolBtn} title="Поделиться"><Share2 size={18} /></button>
            </div>
          </div>

          {/* Meta Data */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}><Calendar size={18} /></div>
              <div>
                <span className={styles.metaLabel}>Дата визита</span>
                <span className={styles.metaValue}>
                  {new Date(record.visit_date).toLocaleDateString('ru-RU', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}><Clock size={18} /></div>
              <div>
                <span className={styles.metaLabel}>Время записи</span>
                <span className={styles.metaValue}>
                  {new Date(record.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={styles.contentArea}>
            <div className={styles.contentLabel}>
              <FileText size={14} /> Заключение специалиста
            </div>
            <p className={styles.notesText}>{record.notes}</p>
          </div>

          {/* Verification stamp-like footer */}
          <div className="mt-12 flex items-center justify-end opacity-20 select-none pointer-events-none">
            <div className="border-4 border-indigo-900 p-2 rounded-xl rotate-12 flex flex-col items-center">
                <Stethoscope size={32} className="text-indigo-900" />
                <span className="text-[8px] font-black text-indigo-900 uppercase">DockerMed Verified</span>
            </div>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <div className={styles.actions}>
          <button onClick={() => router.back()} className={styles.btnBack}>
            <ChevronLeft size={16} strokeWidth={3} /> Вернуться к списку
          </button>
          
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
            Digital Medical Certificate v1.0
          </p>
        </div>

      </div>
    </div>
  )
}