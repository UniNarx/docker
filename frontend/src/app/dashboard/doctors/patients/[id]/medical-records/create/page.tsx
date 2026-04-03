'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { 
  FilePlus2, 
  Calendar, 
  AlignLeft, 
  Paperclip, 
  X, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  AlertCircle,
  FileText
} from 'lucide-react'

// --- Types ---
type CreatedMedicalRecordResponse = {
  _id: string;
  id?: string;
  visitDate: string;
  notes?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-emerald-900/5 border-4 border-white p-10 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#064e3b] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  form: "space-y-8",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#064e3b] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#064e3b] outline-none focus:border-emerald-500/20 focus:bg-white transition-all",
  textarea: "w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] py-5 pl-14 pr-6 text-sm font-bold text-[#064e3b] outline-none focus:border-emerald-500/20 focus:bg-white transition-all min-h-[200px] resize-none",
  
  // File Upload
  fileZone: "border-2 border-dashed border-slate-100 rounded-[25px] p-6 bg-slate-50/50 flex flex-col items-center justify-center group hover:border-emerald-200 transition-colors cursor-pointer relative",
  fileInput: "absolute inset-0 opacity-0 cursor-pointer",
  
  btnSave: "w-full bg-[#059669] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors mt-8 w-full",
};

export default function CreateMedicalRecordPage() {
  const params = useParams();
  const patientIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate || !notes.trim() || !patientIdParam) {
      setError("Заполните обязательные поля");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newRecord = await apiFetch<CreatedMedicalRecordResponse>('/medical-records', {
        method: 'POST',
        body: JSON.stringify({ patientId: patientIdParam, visitDate, notes }),
      });

      const recordId = newRecord._id || newRecord.id;

      // Логика загрузки файлов (если выбраны)
      if (recordId && files && files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') + '/api';
        const token = localStorage.getItem('token');

        await fetch(`${apiBaseUrl}/medical-records/${recordId}/attachments`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
      }

      router.push(`/dashboard/doctors/patients/${patientIdParam}`);
    } catch (err: any) {
      setError(err.message || "Ошибка сохранения");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.layout}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={styles.card}
      >
        <div className={styles.header}>
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[22px] flex items-center justify-center mx-auto mb-6">
            <FilePlus2 size={32} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Новый осмотр</h1>
          <p className={styles.subtitle}>Внесение данных в историю болезни</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-tight mb-8">
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Visit Date */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Calendar size={12} /> Дата приёма</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Calendar size={18} /></div>
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><AlignLeft size={12} /> Клинические заметки</label>
            <div className={styles.inputContainer}>
              <div className={`${styles.iconWrapper} top-8`}><FileText size={18} /></div>
              <textarea
                placeholder="Опишите жалобы, статус и назначения..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={styles.textarea}
                required
              />
            </div>
          </div>

          {/* Attachments */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Paperclip size={12} /> Вложения (Анализы, снимки)</label>
            <div className={styles.fileZone}>
              <input
                type="file"
                multiple
                onChange={e => setFiles(e.target.files)}
                className={styles.fileInput}
              />
              <div className="text-emerald-500 mb-2 group-hover:scale-110 transition-transform">
                <Paperclip size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {files && files.length > 0 ? `Выбрано файлов: ${files.length}` : "Нажмите или перетащите файлы"}
              </p>
              <p className="text-[8px] text-slate-300 uppercase mt-1">PDF, JPG, PNG до 5MB</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={styles.btnSave}
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><CheckCircle2 size={18} /> Зафиксировать приём</>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.back()} 
          className={styles.btnBack}
        >
          <ArrowLeft size={14} strokeWidth={3} />
          Отменить и вернуться
        </button>
      </motion.div>
    </div>
  )
}