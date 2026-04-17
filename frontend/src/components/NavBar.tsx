"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogOut, 
  User, 
  Stethoscope, 
  Users, 
  Calendar, 
  ClipboardList, 
  ShieldCheck,
  LogIn,
  Activity,
  MessageSquare
} from "lucide-react";
import {
    getRoleNameFromToken,
    getTokenFromStorage,
    removeTokenFromStorage,
    ROLE_NAMES,
    RoleName,
} from "@/lib/authUtils";

const styles = {
  navWrapper: "fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100]",
  navInner: "bg-white/80 backdrop-blur-2xl border-2 border-white/50 rounded-[35px] px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-between",
  
  logo: "flex items-center gap-2 text-xl font-black text-[#1e3a8a] uppercase tracking-tighter",
  logoIcon: "w-8 h-8 bg-[#1e3a8a] text-white rounded-xl flex items-center justify-center",

  linksContainer: "hidden lg:flex items-center gap-1",
  
  link: "relative px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2",
  linkActive: "text-[#1e3a8a] bg-[#1e3a8a]/5",
  linkInactive: "text-slate-400 hover:text-[#1e3a8a] hover:bg-slate-50",
  
  logoutBtn: "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] text-red-400 hover:bg-red-50 transition-all flex items-center gap-2",
  
  mobileMenu: "lg:hidden p-2 text-[#1e3a8a]"
};

export default function NavBar() {
  const [currentRoleName, setCurrentRoleName] = useState<RoleName>(ROLE_NAMES.ANONYMOUS);
  const pathname = usePathname();

  const readTokenAndSetRole = () => {
    const token = getTokenFromStorage();
    const roleNameFromToken = getRoleNameFromToken(token);
    setCurrentRoleName(roleNameFromToken);
  };

  useEffect(() => {
    readTokenAndSetRole();
    const handleTokenChange = () => readTokenAndSetRole();
    window.addEventListener("token-changed", handleTokenChange);
    return () => window.removeEventListener("token-changed", handleTokenChange);
  }, []);

  const handleLogout = () => {
    removeTokenFromStorage();
    window.location.href = "/public/login";
  };

  const NavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode, icon: any }) => {
    const isActive = pathname === href || (href !== "/public/doctors" && pathname.startsWith(href));
    return (
      <Link href={href} className={`${styles.link} ${isActive ? styles.linkActive : styles.linkInactive}`}>
        <Icon size={14} strokeWidth={2.5} />
        <span className="hidden xl:inline">{children}</span>
        {isActive && (
          <motion.div 
            layoutId="nav-pill"
            className="absolute inset-0 border-2 border-[#1e3a8a]/10 rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </Link>
    );
  };

  const renderLinks = () => {
    // Аноним
    if (currentRoleName === ROLE_NAMES.ANONYMOUS || !currentRoleName) {
      return (
        <>
          <NavLink href="/public/doctors" icon={Stethoscope}>Врачи</NavLink>
          <NavLink href="/public/login" icon={LogIn}>Войти</NavLink>
        </>
      );
    }
    // Пациент
    if (currentRoleName === ROLE_NAMES.PATIENT) {
      return (
        <>
          <NavLink href="/public/doctors" icon={Stethoscope}>Врачи</NavLink>
          <NavLink href="/dashboard/patients/appointments" icon={Calendar}>Приёмы</NavLink>
          <NavLink href="/dashboard/patients/medical_records" icon={ClipboardList}>Медкарты</NavLink>
          <NavLink href="/dashboard/chat" icon={MessageSquare}>Чат</NavLink>
          <NavLink href="/dashboard/patients/profile" icon={User}>Профиль</NavLink>
        </>
      );
    }
    // Врач
    if (currentRoleName === ROLE_NAMES.DOCTOR) {
      return (
        <>
          <NavLink href="/dashboard/doctors/patients" icon={Users}>Пациенты</NavLink>
          <NavLink href="/dashboard/doctors/appointments" icon={Calendar}>Приёмы</NavLink>
          <NavLink href="/dashboard/chat" icon={MessageSquare}>Чат</NavLink>
          <NavLink href="/dashboard/doctors/profile" icon={User}>Профиль</NavLink>
        </>
      );
    }
    // Админ
    if (currentRoleName === ROLE_NAMES.ADMIN || currentRoleName === ROLE_NAMES.SUPERADMIN) {
      return (
        <>
          <NavLink href="/dashboard/doctors" icon={Stethoscope}>Врачи</NavLink>
          <NavLink href="/dashboard/patients" icon={Users}>Пациенты</NavLink>
          <NavLink href="/dashboard/appointments" icon={Calendar}>Приёмы</NavLink>
          <NavLink href="/dashboard/profile" icon={ShieldCheck}>Админ</NavLink>
        </>
      );
    }
  };

  return (
    <nav className={styles.navWrapper}>
      <div className={styles.navInner}>
        {/* Logo */}
        <Link href="/public/doctors" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Activity size={18} strokeWidth={3} />
          </div>
          <span>Docker<span className="text-slate-400">Med</span></span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.linksContainer}>
          {renderLinks()}
          
          {currentRoleName !== ROLE_NAMES.ANONYMOUS && (
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={14} strokeWidth={2.5} />
              <span className="hidden xl:inline">Выйти</span>
            </button>
          )}
        </div>

        {/* Mobile Indicator (Small circle to show role) */}
        <div className="lg:hidden flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#1e3a8a]">
                 <User size={16} />
            </div>
            {currentRoleName !== ROLE_NAMES.ANONYMOUS && (
                 <button onClick={handleLogout} className="p-2 text-red-400">
                    <LogOut size={18} />
                 </button>
            )}
        </div>
      </div>
    </nav>
  );
}