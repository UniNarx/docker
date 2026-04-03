'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { UploadButton } from '@uploadthing/react';
import { 
  UploadCloud, 
  User, 
  Stethoscope, 
  FileText, 
  ChevronLeft, 
  Save, 
  Loader2, 
  Camera,
  AlertCircle
} from 'lucide-react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

// --- Types ---
type DoctorData = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-2xl w-full bg-white rounded-[45px] shadow-2xl shadow-indigo-900/5 border-4 border-white p-8 md:p-12 relative overflow-hidden",
  
  header: "mb-10 text-center",
  title: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-none mb-2",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]",
  
  // Avatar Section
  avatarContainer: "flex flex-col items-center mb-10 pb-8 border-b border-slate-50",
  avatarWrapper: "relative w-32 h-32 mb-6 group",
  avatarImage: "rounded-[35px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500",
  avatarPlaceholder: "w-full h-full rounded-[35px] bg-slate-50 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200",
  
  // Form elements
  form: "space-y-6",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  fieldGroup: "relative",
  label: "flex items-center gap-2 text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-3 ml-1",
  
  inputContainer: "relative group",
  iconWrapper: "absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors",
  input: "w-full bg-slate-50 border-2 border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-300",
  textarea: "w-full bg-slate-50 border-2 border-slate-100 rounded-[25px] py-4 pl-14 pr-6 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 focus:bg-white transition-all min-h-[160px] resize-none",
  
  // Buttons
  btnSave: "w-full bg-[#1e3a8a] text-white rounded-[24px] py-5 font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50",
  btnBack: "flex items-center justify-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-[#1e3a8a] transition-colors mt-8 w-full",
  
  errorBox: "bg-red-50 border-2 border-red-100 p-4 rounded-[22px] flex items-center gap-3 text-red-500 text-[10px] font-black uppercase tracking-tight mb-8"
};

export default function DoctorEditPage() {
  const router = useRouter();
  const params = useParams();
  const doctorIdFromUrl = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!doctorIdFromUrl) {
      setError('ID врача не найден');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiFetch<DoctorData>(`/doctors/${doctorIdFromUrl}`)
      .then(doctor => {
        if (doctor) {
          setFirstName(doctor.firstName);
          setLastName(doctor.lastName);
          setSpecialty(doctor.specialty);
          setDescription(doctor.description || '');
          setCurrentAvatarUrl(doctor.avatarUrl || null);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [doctorIdFromUrl]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch(`/doctors/${doctorIdFromUrl}`, {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, specialty, description: description.trim() }),
      });
      alert('Данные успешно обновлены!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUploadComplete = async (res?: any[]) => {
    setIsUploading(false);
    const newAvatarUrl = res?.[0].fileUrl || res?.[0].url;
    if (!newAvatarUrl) return;

    try {
      const updateResponse = await apiFetch<{ avatarUrl: string }>(
        `/doctors/${doctorIdFromUrl}/avatar`,
        { method: 'PUT', body: JSON.stringify({ avatarUrl: newAvatarUrl }) }
      );
      setCurrentAvatarUrl(updateResponse.avatarUrl);
    } catch (err: any) {
      setError(err.message);
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
        <header className={styles.header}>
          <h1 className={styles.title}>Профиль врача</h1>
          <p className={styles.subtitle}>Редактирование публичной информации</p>
        </header>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        {/* --- Avatar Section --- */}
        <div className={styles.avatarContainer}>
          <div className={styles.avatarWrapper}>
            {currentAvatarUrl ? (
              <Image
                src={currentAvatarUrl}
                alt="Doctor Avatar"
                fill
                className={styles.avatarImage}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <Camera size={32} />
                <span className="text-[8px] font-black uppercase mt-2">Нет фото</span>
              </div>
            )}
          </div>

          <UploadButton<OurFileRouter, "avatarUploader">
            endpoint="avatarUploader"
            onClientUploadComplete={handleAvatarUploadComplete}
            onUploadError={(err) => { setIsUploading(false); setError(err.message); }}
            onUploadBegin={() => { setIsUploading(true); setError(null); }}
            appearance={{
              button: "ut-ready:bg-indigo-600 ut-uploading:cursor-not-allowed bg-indigo-500 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all hover:scale-105",
              allowedContent: "hidden"
            }}
            content={{
              button({ ready, isUploading: uploading }) {
                if (uploading) return "Загрузка...";
                if (ready) return "Изменить аватар";
                return "Подготовка...";
              }
            }}
          />
          {isUploading && <p className="text-[9px] font-black text-indigo-400 uppercase mt-3 animate-pulse">Передача данных...</p>}
        </div>

        {/* --- Form Section --- */}
        <form onSubmit={handleProfileSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* First Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}><User size={12} /> Имя</label>
              <div className={styles.inputContainer}>
                <div className={styles.iconWrapper}><User size={18} /></div>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            {/* Last Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}><User size={12} /> Фамилия</label>
              <div className={styles.inputContainer}>
                <div className={styles.iconWrapper}><User size={18} /></div>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            </div>
          </div>

          {/* Specialty */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><Stethoscope size={12} /> Специализация</label>
            <div className={styles.inputContainer}>
              <div className={styles.iconWrapper}><Stethoscope size={18} /></div>
              <input
                type="text"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}><FileText size={12} /> Описание и опыт</label>
            <div className={styles.inputContainer}>
              <div className={`${styles.iconWrapper} top-8`}><FileText size={18} /></div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={styles.textarea}
                placeholder="Расскажите о квалификации врача..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploading}
            className={styles.btnSave}
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <><Save size={18} /> Сохранить изменения</>
            )}
          </button>
        </form>

        <button 
          onClick={() => router.push('/dashboard/doctors')}
          className={styles.btnBack}
        >
          <ChevronLeft size={14} strokeWidth={3} />
          Назад к списку
        </button>
      </motion.div>
    </div>
  );
}