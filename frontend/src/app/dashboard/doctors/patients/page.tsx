'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  UserCircle, 
  Calendar, 
  ChevronRight, 
  Loader2,
  FileText,
  Shield
} from 'lucide-react'
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES
} from '@/lib/authUtils';

// --- Types ---
type PatientData = {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
};

type DoctorMeData = { _id: string; };

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans",
  container: "max-w-5xl mx-auto",
  
  // Header
  header: "flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6",
  title: "text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  subtitle: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mt-1",
  
  // Search Bar
  searchWrapper: "relative group w-full md:w-72",
  searchInput: "w-full bg-white border-2 border-slate-100 rounded-[20px] py-3 pl-12 pr-4 text-sm font-bold text-[#1e3a8a] outline-none focus:border-indigo-500/20 shadow-sm transition-all",
  searchIcon: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors",

  // Grid/List
  grid: "grid grid-cols-1 gap-4",
  patientCard: "bg-white rounded-[30px] border-4 border-white shadow-xl shadow-indigo-900/5 p-6 flex items-center justify-between group hover:scale-[1.01] transition-all duration-300",
  
  avatar: "w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300",
  info: "flex-1 ml-6",
  name: "text-lg font-black text-[#1e3a8a] leading-none mb-1",
  meta: "flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
  
  btnView: "bg-slate-50 text-slate-400 p-4 rounded-[20px] group-hover:bg-[#1e3a8a] group-hover:text-white transition-all duration-300 shadow-inner",
  emptyState: "text-center py-24 bg-white rounded-[45px] border-4 border-white shadow-xl shadow-indigo-900/5"
};

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientData[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const token = getTokenFromStorage();
    const decodedToken = token ? getDecodedToken(token) : null;

    if (!token || decodedToken?.roleName !== ROLE_NAMES.DOCTOR) {
      setError('Доступ только для медицинского персонала');
      setIsLoading(false);
      return;
    }

    apiFetch<DoctorMeData>('/doctors/me')
      .then(profile => apiFetch<PatientData[]>(`/doctors/${profile._id}/patients`))
      .then(data => setPatients(data || []))
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredPatients = patients?.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (dob: string) => {
    const ageDifMs = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="w-10 h-10 text-[#1e3a8a] animate-spin" />
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className={styles.title}>Пациенты</h1>
            <span className={styles.subtitle}>Ваша персональная база данных</span>
          </motion.div>

          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="Поиск по имени..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {error ? (
          <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[30px] flex items-center gap-4 text-red-500 font-black uppercase text-[10px] tracking-widest">
            <Shield size={20} /> {error}
          </div>
        ) : (
          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filteredPatients && filteredPatients.length > 0 ? (
                filteredPatients.map((patient, i) => (
                  <motion.div
                    key={patient._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    layout
                  >
                    <Link href={`/dashboard/doctors/patients/${patient._id}`} className={styles.patientCard}>
                      <div className={styles.avatar}>
                        <UserCircle size={28} />
                      </div>
                      
                      <div className={styles.info}>
                        <h2 className={styles.name}>{patient.firstName} {patient.lastName}</h2>
                        <div className={styles.meta}>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} /> {new Date(patient.dateOfBirth).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-md">
                            {calculateAge(patient.dateOfBirth)} лет
                          </span>
                        </div>
                      </div>

                      <div className={styles.btnView}>
                        <ChevronRight size={24} strokeWidth={3} />
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyState}>
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Users size={40} />
                  </div>
                  <h3 className="text-[#1e3a8a] font-black uppercase tracking-tighter text-xl">Пациенты не найдены</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Попробуйте изменить параметры поиска</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <footer className="mt-12 flex items-center justify-between px-6">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
             <Shield size={14} /> Защищенное соединение SSL
           </div>
           <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
             Всего: {filteredPatients?.length || 0}
           </div>
        </footer>
      </div>
    </div>
  )
}