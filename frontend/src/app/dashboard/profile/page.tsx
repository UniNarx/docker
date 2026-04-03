'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Key, 
  UserPlus, 
  Trash2, 
  Calendar, 
  Fingerprint,
  Users,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import {
    getTokenFromStorage,
    getDecodedToken,
    ROLE_NAMES,
    RoleName
} from '@/lib/authUtils';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [ROLE_NAMES.PATIENT]:    'Пациент',
  [ROLE_NAMES.DOCTOR]:     'Врач',
  [ROLE_NAMES.ADMIN]:      'Администратор',
  [ROLE_NAMES.SUPERADMIN]: 'Главный администратор',
};

type UserProfileData = {
  id: string;
  username: string;
  roleName: string;
  createdAt?: string;
};

type UserListItem = {
    _id: string;
    id?: string;
    username: string;
    createdAt: string;
};

const styles = {
  layout: "min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans flex flex-col items-center",
  container: "max-w-2xl w-full",
  
  // Account Card
  card: "bg-white rounded-[40px] shadow-2xl shadow-slate-900/5 border-4 border-white p-8 md:p-12 mb-8 relative overflow-hidden",
  badge: "absolute top-8 right-8 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2",
  
  // Info Rows
  infoRow: "flex items-center gap-4 py-4 border-b border-slate-50 last:border-0",
  iconBox: "w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400",
  label: "text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-0.5",
  value: "text-sm font-bold text-[#1e3a8a]",

  // Admin Section
  adminSection: "bg-white rounded-[35px] border-4 border-white shadow-xl shadow-slate-900/5 overflow-hidden",
  adminHeader: "bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between",
  adminTitle: "text-[11px] font-black text-[#1e3a8a] uppercase tracking-[0.2em] flex items-center gap-2",
  
  // Buttons
  btnAction: "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
  btnPassword: "bg-white border-2 border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100",
  btnAdd: "bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95",
  btnDelete: "p-2 text-slate-300 hover:text-red-500 transition-colors"
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [currentUserRoleName, setCurrentUserRoleName] = useState<RoleName>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [adminsList, setAdminsList] = useState<UserListItem[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  useEffect(() => {
    const token = getTokenFromStorage();
    const decoded = getDecodedToken(token);
    setCurrentUserRoleName(decoded?.roleName as RoleName || null);

    apiFetch<{ data: UserProfileData }>('/users/me')
      .then(res => setCurrentUser(res.data))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (currentUserRoleName === ROLE_NAMES.SUPERADMIN) {
      setIsLoadingAdmins(true);
      apiFetch<UserListItem[]>(`/users?roleName=${ROLE_NAMES.ADMIN}`)
        .then(data => setAdminsList(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setIsLoadingAdmins(false));
    }
  }, [currentUserRoleName]);

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Удалить администратора?')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      setAdminsList(prev => prev.filter(a => (a._id || a.id) !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) return <div className={styles.layout}><Loader2 className="animate-spin text-indigo-500 mt-20" /></div>;

  return (
    <div className={styles.layout}>
      <div className={styles.container}>
        
        {/* --- Основная карточка профиля --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
        >
          <div className={`${styles.badge} ${currentUser?.roleName === ROLE_NAMES.SUPERADMIN ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
            <Shield size={12} />
            {currentUser?.roleName ? ROLE_DISPLAY_NAMES[currentUser.roleName] : 'Пользователь'}
          </div>

          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-[#1e3a8a] border-2 border-white shadow-inner">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e3a8a] uppercase tracking-tighter">Аккаунт</h1>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Управление учетными данными</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 mb-10">
            <div className={styles.infoRow}>
              <div className={styles.iconBox}><Fingerprint size={18} /></div>
              <div>
                <span className={styles.label}>Имя пользователя</span>
                <span className={styles.value}>{currentUser?.username}</span>
              </div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.iconBox}><Calendar size={18} /></div>
              <div>
                <span className={styles.label}>Дата регистрации</span>
                <span className={styles.value}>
                  {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard/profile/password" className="flex-1">
              <button className={`${styles.btnAction} ${styles.btnPassword}`}>
                <Key size={14} /> Сменить пароль
              </button>
            </Link>
            {currentUserRoleName === ROLE_NAMES.SUPERADMIN && (
              <Link href="/dashboard/profile/create-admin" className="flex-1">
                <button className={`${styles.btnAction} ${styles.btnAdd}`}>
                  <UserPlus size={14} /> Создать Admin
                </button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* --- Список администраторов (только для SuperAdmin) --- */}
        {currentUserRoleName === ROLE_NAMES.SUPERADMIN && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.adminSection}
          >
            <div className={styles.adminHeader}>
              <h2 className={styles.adminTitle}><Users size={14} /> Управление доступом</h2>
              <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                Admin List
              </span>
            </div>

            <div className="p-4">
              {isLoadingAdmins ? (
                <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-200" /></div>
              ) : adminsList.length > 0 ? (
                <div className="space-y-2">
                  {adminsList.map((admin) => (
                    <div key={admin._id || admin.id} className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all border-2 border-transparent hover:border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1e3a8a]">{admin.username}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            ID: {(admin._id || admin.id || '').slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAdmin(admin._id || admin.id || '')}
                        className={styles.btnDelete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-300">
                  <AlertCircle size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Список пуст</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">DockerMed Security Protocol v2.4</p>
        </footer>
      </div>
    </div>
  )
}