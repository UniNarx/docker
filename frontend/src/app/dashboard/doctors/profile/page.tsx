'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Lock, 
  Mail, 
  Stethoscope, 
  Info, 
  ShieldCheck,
  Loader2,
  Camera
} from 'lucide-react';

// --- Types ---
type DoctorProfileData = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans",
  card: "max-w-2xl w-full bg-white rounded-[50px] shadow-2xl shadow-indigo-900/10 border-4 border-white overflow-hidden relative",
  
  // Cover & Avatar
  cover: "h-32 bg-gradient-to-r from-indigo-600 to-blue-500 w-full",
  avatarWrapper: "relative -mt-16 mb-6 flex justify-center",
  avatarContainer: "relative w-32 h-32 rounded-[40px] border-8 border-white shadow-xl overflow-hidden bg-slate-100",
  avatarPlaceholder: "w-full h-full flex items-center justify-center text-slate-300 bg-slate-50",
  
  // Content
  content: "px-10 pb-12 text-center",
  name: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter mb-1",
  specialtyBadge: "inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-8",
  
  // Info Grid
  sectionTitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2",
  descriptionBox: "bg-slate-50/50 border-2 border-slate-50 rounded-[30px] p-6 text-sm text-slate-600 leading-relaxed text-left mb-10",
  
  // Buttons
  btnPrimary: "flex-1 bg-[#1e3a8a] text-white rounded-[22px] py-4 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3",
  btnSecondary: "flex-1 bg-white border-2 border-slate-100 text-slate-400 rounded-[22px] py-4 px-6 font-black text-[10px] uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-3"
};

export default function DoctorProfilePage() {
  const [doctorData, setDoctorData] = useState<DoctorProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch<DoctorProfileData>('/doctors/me')
      .then(data => setDoctorData(data))
      .catch(e => {
        if (e.message.includes('401')) {
          localStorage.removeItem('token');
          router.push('/public/login');
        } else {
          setError(e.message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="bg-red-50 text-red-500 p-6 rounded-[30px] border-2 border-red-100 font-bold flex items-center gap-3">
        <ShieldCheck /> {error}
      </div>
    </div>
  );

  return (
    <div className={styles.layout}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        {/* Декоративный фон сверху */}
        <div className={styles.cover} />

        {/* Аватар */}
        <div className={styles.avatarWrapper}>
          <div className={styles.avatarContainer}>
            {doctorData?.avatarUrl ? (
              <Image
                src={doctorData.avatarUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute bottom-2 right-2 p-1.5 bg-white rounded-xl shadow-lg text-indigo-500">
              <Camera size={14} />
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {/* Основная инфо */}
          <h1 className={styles.name}>
            {doctorData?.firstName} {doctorData?.lastName}
          </h1>
          <div className={styles.specialtyBadge}>
            <Stethoscope size={14} />
            {doctorData?.specialty}
          </div>

          {/* Описание */}
          <div className="mb-10">
            <h2 className={styles.sectionTitle}>
              <Info size={12} /> Профессиональный профиль
            </h2>
            <div className={styles.descriptionBox}>
              {doctorData?.description || "Информация о враче не заполнена. Добавьте описание своего опыта и квалификации в настройках профиля."}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/doctors/profile/edit" className="flex-1">
              <button className={styles.btnPrimary}>
                <Settings size={16} /> Редактировать профиль
              </button>
            </Link>
            
            <Link href="/dashboard/doctors/profile/password" className="flex-1">
              <button className={styles.btnSecondary}>
                <Lock size={16} /> Безопасность
              </button>
            </Link>
          </div>

          {/* Подвал карточки */}
          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center gap-6 text-slate-300">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
              <ShieldCheck size={14} /> Верифицированный врач
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}