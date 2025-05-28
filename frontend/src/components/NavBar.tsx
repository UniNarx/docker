// components/NavBar.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

function getRoleFromToken(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role_id;
  } catch {
    return 0;
  }
}

export default function NavBar() {
  const [role, setRole] = useState<number>(0);

  const readToken = () => {
    const token = localStorage.getItem("token");
    setRole(token ? getRoleFromToken(token) : 0);
  };

  useEffect(() => {
    readToken();
    window.addEventListener("token-changed", readToken);
    return () => window.removeEventListener("token-changed", readToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.assign("/public/login");
  };

  const linkClass =
    "relative px-2 py-1 font-medium text-gray-800 transition-transform duration-200 hover:scale-105";

  const fancyUnderline = (active?: boolean) =>
    `after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 ${
      active
        ? "after:w-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
        : "after:w-0 after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
    } group-hover:after:w-full after:transition-all after:duration-300`;

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={`group ${linkClass} ${fancyUnderline()}`}
    >
      <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500">
        {children}
      </span>
    </Link>
  );

  const commonLogout = (
    <button
      onClick={handleLogout}
      className={`${linkClass} inline-block text-base text-red-500 hover:text-red-600`}
    >
      Выйти
    </button>
  );

  const renderLinks = () => {
    if (role === 0) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/public/login">Войти</NavLink>
        </>
      );
    }
    if (role === 1) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/dashboard/patients/appointments">Мои приёмы</NavLink>
          <NavLink href="/dashboard/patients/medical_records">Мои медкарты</NavLink>
          <NavLink href="/dashboard/patients/profile">Профиль</NavLink>
          {commonLogout}
        </>
      );
    }
    if (role === 2) {
      return (
        <>
          <NavLink href="/dashboard/doctors/patients">Пациенты</NavLink>
          <NavLink href="/dashboard/doctors/appointments">Приёмы</NavLink>
          {commonLogout}
        </>
      );
    }
    return (
      <>
        <NavLink href="/dashboard/doctors">Упр. врачи</NavLink>
        <NavLink href="/dashboard/patients">Упр. пациенты</NavLink>
        <NavLink href="/dashboard/appointments">Упр. приёмы</NavLink>
        <NavLink href="/dashboard/profile">Профиль</NavLink>
        {commonLogout}
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
