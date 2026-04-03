'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { User, ChevronRight, Stethoscope, Search } from 'lucide-react'

const styles = {
  layout: "min-h-screen bg-[#f8fafc] px-4 pb-20 pt-12 font-sans",
  container: "max-w-6xl mx-auto",
  header: "text-center mb-16",
  title: "text-5xl font-black text-[#1e3a8a] uppercase tracking-tighter mb-4",
  subtitle: "text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]",
  
  section: "mb-16",
  sectionHeader: "flex items-center gap-4 mb-8",
  specBadge: "px-8 py-3 bg-[#1e3a8a] rounded-[24px] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-[#1e3a8a]/20",
  specLine: "h-[2px] flex-1 bg-[#1e3a8a]/10",
  
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
  card: "group relative p-8 bg-white border-2 border-white shadow-xl shadow-black/5 rounded-[45px] transition-all duration-300 hover:border-[#1e3a8a]/20 hover:shadow-2xl hover:shadow-[#1e3a8a]/10",
  
  avatarContainer: "w-20 h-20 bg-slate-100 rounded-[30px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500",
  doctorName: "text-2xl font-black text-[#1e3a8a] leading-tight mb-2 uppercase tracking-tighter",
  doctorSpec: "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2",
  
  btnPrimary: "w-full py-4 bg-[#1e3a8a] text-white rounded-[22px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-[#1e3a8a]/30 active:scale-95 transition-all hover:bg-[#1e488a]",
  emptyState: "text-center py-20 bg-white/40 rounded-[45px] border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase text-xs tracking-widest"
};

type DoctorData = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

export default function PublicDoctorsListPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<DoctorData[]>('/doctors')
      .then(data => setDoctors(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const specialties = Array.from(new Set(doctors.map(d => d.specialty))).sort();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-[#1e3a8a]/10 border-t-[#1e3a8a] rounded-full animate-spin" />
        <span className={styles.subtitle}>Загрузка врачей</span>
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.subtitle}>Наши специалисты</div>
          <h1 className={styles.title}>Команда<br/>профессионалов</h1>
        </header>

        {error && (
          <div className="p-6 mb-10 bg-red-50 border-2 border-red-100 rounded-[30px] text-red-600 text-sm font-bold text-center">
            {error}
          </div>
        )}

        {doctors.length === 0 ? (
          <div className={styles.emptyState}>Врачей пока нет в списке</div>
        ) : (
          specialties.map((spec) => (
            <section key={spec} className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.specBadge}>{spec}</div>
                <div className={styles.specLine} />
              </div>
              
              <div className={styles.grid}>
                {doctors.filter(d => d.specialty === spec).map((doctor, idx) => (
                  <motion.div
                    key={doctor._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={styles.card}
                  >
                    <div className={styles.avatarContainer}>
                      <User size={32} className="text-[#1e3a8a]" />
                    </div>
                    
                    <h3 className={styles.doctorName}>
                      {doctor.firstName} <br/> {doctor.lastName}
                    </h3>
                    
                    <div className={styles.doctorSpec}>
                      <Stethoscope size={12} strokeWidth={3} />
                      {spec}
                    </div>

                    <a href={`/public/doctors/${doctor._id}`} className={styles.btnPrimary}>
                      Подробнее <ChevronRight size={14} strokeWidth={3} />
                    </a>
                  </motion.div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}