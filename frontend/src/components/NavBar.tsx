// components/NavBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ROLE_IDS = {
  PATIENT: "6836ec7ff5b12770e1c81b34",
  DOCTOR:  "6836ec7ff5b12770e1c81b35",
  ADMIN:   "6836ec7ff5b12770e1c81b36",
  SUPER:   "6836ec7ff5b12770e1c81b37",
};

function getRoleFromToken(token: string): string | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const { roleId } = JSON.parse(atob(payloadBase64));
    return roleId || null;
  } catch {
    return null;
  }
}

export default function NavBar() {
  // храним roleId из токена, или null (аноним)
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  // читаем токен и дергаем при событии 'token-changed'
  const readToken = () => {
    const token = localStorage.getItem("token");
    setRole(token ? getRoleFromToken(token) : null);
  };

  useEffect(() => {
    readToken();
    window.addEventListener("token-changed", readToken);
    return () => window.removeEventListener("token-changed", readToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    // сообщаем NavBar, что токена больше нет
    window.dispatchEvent(new Event("token-changed"));
    // и уходим на логин
    window.location.href = "/public/login";
  };

  // базовые классы и функция для under­line
  const linkClass = "relative px-2 py-1 font-medium text-gray-800 transition-transform duration-200 hover:scale-105";
  const fancyUnderline = (active: boolean) =>
    `after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 ${
      active
        ? "after:w-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
        : "after:w-0"
    } after:transition-all after:duration-300`;

  // обёртка, которая умеет подсвечивать активный линк
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className={`group ${linkClass} ${fancyUnderline(isActive)}`}>
        <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500">
          {children}
        </span>
      </Link>
    );
  };

  // общая кнопка «Выйти»
  const LogoutBtn = (
    <button onClick={handleLogout} className={`${linkClass} text-red-500 hover:text-red-600`}>
      Выйти
    </button>
  );

  // рендерим набор линков в зависимости от роли
  const renderLinks = () => {
    if (!role) {
      // аноним
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/public/login">Войти</NavLink>
        </>
      );
    }
    if (role === ROLE_IDS.PATIENT) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/dashboard/patients/appointments">Мои приёмы</NavLink>
          <NavLink href="/dashboard/patients/medical_records">Мои медкарты</NavLink>
          <NavLink href="/dashboard/patients/profile">Профиль</NavLink>
          {LogoutBtn}
        </>
      );
    }
    if (role === ROLE_IDS.DOCTOR) {
      return (
        <>
          <NavLink href="/dashboard/doctors/patients">Пациенты</NavLink>
          <NavLink href="/dashboard/doctors/appointments">Приёмы</NavLink>
          {LogoutBtn}
        </>
      );
    }
    // ADMIN или SUPERADMIN
    return (
      <>
        <NavLink href="/dashboard/doctors">Упр. врачи</NavLink>
        <NavLink href="/dashboard/patients">Упр. пациенты</NavLink>
        <NavLink href="/dashboard/appointments">Упр. приёмы</NavLink>
        <NavLink href="/dashboard/profile">Профиль</NavLink>
        {LogoutBtn}
      </>
    );
  };

  return (
    <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/public/doctors" className="text-2xl font-bold text-indigo-600">
          Docker<span className="text-purple-500">Med</span>
        </Link>
        <div className="flex space-x-6">{renderLinks()}</div>
      </div>
    </nav>
  );
}
