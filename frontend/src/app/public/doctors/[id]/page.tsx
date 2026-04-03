'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Calendar, Clock, User, CheckCircle2, Zap } from 'lucide-react';
import {
    getTokenFromStorage,
    getRoleNameFromToken,
    ROLE_NAMES,
    RoleName
} from '@/lib/authUtils';

const styles = {
  layout: "min-h-screen bg-[#f8fafc] px-4 py-12 font-sans",
  container: "max-w-2xl mx-auto",
  
  // Карточка профиля
  card: "bg-white/70 backdrop-blur-xl border-2 border-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[50px] p-8 md:p-12",
  
  // Верхняя часть (Аватар + Имя)
  header: "flex flex-col items-center text-center mb-10",
  avatarWrapper: "relative w-32 h-32 mb-6",
  avatarImage: "rounded-[40px] object-cover border-4 border-white shadow-xl",
  avatarPlaceholder: "w-full h-full bg-slate-100 rounded-[40px] flex items-center justify-center text-[#1e3a8a]/20 border-4 border-white shadow-inner",
  
  name: "text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter leading-tight mb-2",
  specialtyBadge: "px-6 py-2 bg-[#1e3a8a]/5 text-[#1e3a8a] rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
  
  // Секция "О себе"
  description: "mt-8 p-6 bg-slate-50/50 rounded-[30px] border border-slate-100 text-slate-600 text-sm leading-relaxed",
  
  // Выбор даты и слотов
  label: "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mb-3 block",
  dateInputWrapper: "relative mb-8",
  dateInput: "w-full p-5 bg-white border-2 border-slate-100 rounded-[25px] text-[#1e3a8a] font-black text-sm focus:outline-none focus:border-[#1e3a8a]/20 transition-all shadow-sm",
  
  // Сетка слотов
  slotsGrid: "grid grid-cols-3 sm:grid-cols-4 gap-3 mb-10",
  slotBtn: "py-4 rounded-[20px] text-xs font-black uppercase transition-all border-2 flex items-center justify-center",
  slotActive: "bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg shadow-[#1e3a8a]/20 scale-95",
  slotInactive: "bg-white border-slate-100 text-slate-400 hover:border-[#1e3a8a]/20 hover:text-[#1e3a8a]",
  
  // Кнопка записи
  bookBtn: "w-full py-5 rounded-[26px] font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]",
  bookBtnReady: "bg-[#1e3a8a] text-white shadow-[#1e3a8a]/30",
  bookBtnDisabled: "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none",
  
  backBtn: "flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-[#1e3a8a] transition-all mb-8 ml-2"
};

// Types (оставлены без изменений)
type DoctorData = {
  _id: string; id?: string;
  firstName: string; lastName: string;
  specialty: string; avatarUrl?: string;
  description?: string;
};
type PatientProfileInfo = { _id: string; id?: string; };

export default function PublicDoctorProfilePage() {
  const params = useParams();
  const doctorIdParam = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<RoleName>(ROLE_NAMES.ANONYMOUS);
  const [currentPatientProfileId, setCurrentPatientProfileId] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  // Logic Effects (оставлены без изменений)
  useEffect(() => {
    const storedToken = getTokenFromStorage();
    setToken(storedToken);
    const roleName = getRoleNameFromToken(storedToken);
    setCurrentUserRole(roleName);

    if (storedToken && roleName === ROLE_NAMES.PATIENT) {
      apiFetch<PatientProfileInfo>('/patients/me')
        .then(profile => setCurrentPatientProfileId(profile._id || profile.id || null))
        .catch(() => setCurrentPatientProfileId(null));
    }
  }, []);

  useEffect(() => {
    if (!doctorIdParam) return;
    setIsLoadingDoctor(true);
    apiFetch<DoctorData>(`/doctors/${doctorIdParam}`)
      .then(setDoctor)
      .catch(e => setDoctorError(e.message))
      .finally(() => setIsLoadingDoctor(false));
  }, [doctorIdParam]);

  useEffect(() => {
    if (!doctorIdParam || !selectedDate) return;
    setIsLoadingSlots(true);
    apiFetch<string[]>(`/doctors/${doctorIdParam}/availability?date=${selectedDate}`)
      .then(setAvailableSlots)
      .catch(e => setSlotsError(e.message))
      .finally(() => setIsLoadingSlots(false));
  }, [doctorIdParam, selectedDate]);

  const handleBookAppointment = async () => {
    if (!selectedBookingSlot || !currentPatientProfileId || !doctor) return;
    setIsBooking(true);
    try {
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: doctor._id || doctor.id,
          patientId: currentPatientProfileId,
          apptTime: `${selectedDate}T${selectedBookingSlot}:00Z`,
        }),
      });
      setIsLoadingSlots(true);
      const freshSlots = await apiFetch<string[]>(`/doctors/${doctorIdParam}/availability?date=${selectedDate}`);
      setAvailableSlots(freshSlots);
      setSelectedBookingSlot('');
      alert('Успешно!'); 
    } catch (e: any) {
      alert('Ошибка: ' + e.message);
    } finally {
      setIsBooking(false);
      setIsLoadingSlots(false);
    }
  };

  if (isLoadingDoctor) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
       <div className="w-10 h-10 border-4 border-[#1e3a8a]/10 border-t-[#1e3a8a] rounded-full animate-spin" />
    </div>
  );

  if (doctorError || !doctor) return <div className={styles.layout}>{doctorError || "Врач не найден"}</div>;

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ChevronLeft size={16} strokeWidth={3} /> Вернуться назад
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.card}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.avatarWrapper}>
              {doctor.avatarUrl ? (
                <Image
                  src={doctor.avatarUrl}
                  alt={doctor.lastName}
                  fill
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <User size={48} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <h1 className={styles.name}>{doctor.firstName} <br/> {doctor.lastName}</h1>
            <span className={styles.specialtyBadge}>{doctor.specialty}</span>
            
            {doctor.description && (
              <div className={styles.description}>
                <p>{doctor.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Date Selection */}
            <div>
              <label className={styles.label}>Дата приема</label>
              <div className={styles.dateInputWrapper}>
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1e3a8a] pointer-events-none" size={18} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className={`${styles.dateInput} pl-14`}
                  min={today}
                />
              </div>
            </div>

            {/* Slots Selection */}
            <div>
              <label className={styles.label}>Доступное время</label>
              {isLoadingSlots ? (
                <div className="flex gap-2 mb-10 overflow-hidden">
                  {[1,2,3,4].map(i => <div key={i} className="flex-1 h-14 bg-slate-50 rounded-[20px] animate-pulse" />)}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-[30px] border-2 border-dashed border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-10">
                  Нет слотов на эту дату
                </div>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedBookingSlot(time)}
                      className={`${styles.slotBtn} ${selectedBookingSlot === time ? styles.slotActive : styles.slotInactive}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4">
              {!token ? (
                <Link href="/public/login" className={`${styles.bookBtn} ${styles.bookBtnReady}`}>
                  Войти для записи
                </Link>
              ) : currentUserRole === ROLE_NAMES.PATIENT ? (
                <button
                  onClick={handleBookAppointment}
                  disabled={!selectedBookingSlot || isBooking || isLoadingSlots}
                  className={`${styles.bookBtn} ${selectedBookingSlot ? styles.bookBtnReady : styles.bookBtnDisabled}`}
                >
                  {isBooking ? (
                    <Zap size={18} className="animate-pulse" fill="currentColor" />
                  ) : (
                    <>
                      {selectedBookingSlot ? `Записаться на ${selectedBookingSlot}` : 'Выберите время'}
                      {selectedBookingSlot && <CheckCircle2 size={18} />}
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Запись доступна только пациентам
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}