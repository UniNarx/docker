'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  Calendar, 
  FileText, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  History
} from 'lucide-react'

// --- Types ---
type MedicalRecordData = {
  _id: string;
  id?: string;
  visitDate: string;
  notes?: string;
  attachments?: string[];
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-indigo-900/5 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-6",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all",
  textarea: "w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] py-5 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all min-h-[180px] resize-none",
  
  // Actions
  actionGrid: "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10",
  btnSave: "bg-[#1e3a8a] text-white rounded-[22px] py-4 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50",
  btnDelete: "bg-white border-2 border-red-50 text-red-400 rounded-[22px] py-4 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50",
  
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors mt-8 w-full",
  
  dangerZone: "mt-8 pt-8 border-t border-slate-50"
};

export default function EditMedicalRecordPage() {
  const params = useParams();
  const recordIdParam = Array.isArray(params.recordId) ? params.recordId[0] : params.recordId;
  const router = useRouter();

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [notes, setNotes] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordIdParam) return;
    
    apiFetch<MedicalRecordData>(`/medical-records/${recordIdParam}`)
      .then(data => {
        setMedicalRecord(data);
        setVisitDate(data.visitDate ? data.visitDate.slice(0, 10) : '');
        setNotes(data.notes ?? '');
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [recordIdParam]);

  const handleSave = async () => {
    if (!visitDate) return alert('Укажите дату');
    setSaving(true);
    try {
      await apiFetch(`/medical-records/${medicalRecord?._id || medicalRecord?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visitDate, notes, attachments: medicalRecord?.attachments || [] }),
      });
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены? Это действие удалит запись из истории болезни навсегда.')) return;
    setSaving(true);
    try {
      await apiFetch(`/medical-records/${medicalRecord?._id || medicalRecord?.id}`, { method: 'DELETE' });
      router.back();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
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
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center mx-auto mb-6">
            <History size={32} />
          </div>
          <h1 className={styles.title}>Коррекция записи</h1>
          <p className={styles.subtitle}>Правка клинических данных</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase mb-6">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div className={styles.form}>
          {/* Visit Date */}
          <div className="relative">
            <label className={styles.label}><Calendar size={12} /> Дата визита</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Calendar size={18} /></div>
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="relative">
            <label className={styles.label}><FileText size={12} /> Клиническая картина</label>
            <div className={styles.inputContainer}>
              <div className={`${styles.iconWrapper} top-8`}><Edit3 size={18} /></div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={styles.textarea}
                placeholder="Обновите симптомы, диагноз или рекомендации..."
              />
            </div>
          </div>

          <div className={styles.actionGrid}>
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.btnSave}
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Сохранить</>}
            </button>

            <button
              onClick={() => router.back()}
              className="bg-slate-50 text-slate-500 rounded-[22px] py-4 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all text-center"
            >
              Отмена
            </button>
          </div>

          <div className={styles.dangerZone}>
            <button
              onClick={handleDelete}
              disabled={saving}
              className={styles.btnDelete}
            >
              <Trash2 size={18} /> Удалить запись из базы
            </button>
          </div>
        </div>

        <button onClick={() => router.back()} className={styles.btnBack}>
          <ArrowLeft size={14} strokeWidth={3} /> Назад к профилю пациента
        </button>
      </motion.div>
    </div>
  );
}