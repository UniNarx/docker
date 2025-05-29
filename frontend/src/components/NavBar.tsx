// components/NavBar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Добавили useRouter
import { useEffect, useState } from "react";
import {
    getRoleNameFromToken,
    getTokenFromStorage,
    removeTokenFromStorage,
    ROLE_NAMES, // Импортируем имена ролей
    RoleName,
    saveTokenToStorage // Если нужно для логина из NavBar (хотя обычно логин на отдельной странице)
} from "@/lib/authUtils"; // Путь к вашему файлу

export default function NavBar() {
  // Используем currentRoleName из вашего нового authUtils
  const [currentRoleName, setCurrentRoleName] = useState<RoleName>(ROLE_NAMES.ANONYMOUS);
  const pathname = usePathname();
  const router = useRouter(); // Для навигации после logout

  // Функция для чтения токена и установки роли
  const readTokenAndSetRole = () => {
    const token = getTokenFromStorage();
    const roleNameFromToken = getRoleNameFromToken(token);
    setCurrentRoleName(roleNameFromToken);
    console.log("NavBar: Role set to ->", roleNameFromToken); // Лог для отладки
  };

  useEffect(() => {
    readTokenAndSetRole(); // Читаем при монтировании

    // Обработчик кастомного события 'token-changed'
    const handleTokenChange = (event: Event) => {
      console.log("NavBar: Event 'token-changed' detected.", (event as CustomEvent).detail);
      readTokenAndSetRole(); // Перечитываем токен и обновляем роль
    };

    window.addEventListener("token-changed", handleTokenChange);

    // Очистка слушателя при размонтировании компонента
    return () => {
      window.removeEventListener("token-changed", handleTokenChange);
    };
  }, []); // Пустой массив зависимостей, чтобы эффект выполнился один раз при монтировании и очистился при размонтировании

  const handleLogout = () => {
    removeTokenFromStorage(); // Удаляем токен и диспатчим событие (authUtils должен это делать)
    // setCurrentRoleName(ROLE_NAMES.ANONYMOUS); // Сразу обновляем роль в UI
    // router.push("/public/login"); // Используем Next.js router для навигации
    // Перезагрузка страницы может быть более надежным способом сбросить все состояния, если есть сложности
     window.location.href = "/public/login";
  };

  const linkClass = "relative px-2 py-1 font-medium text-gray-800 transition-transform duration-200 hover:scale-105";
  const fancyUnderline = (active: boolean) =>
    `after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 ${
      active
        ? "after:w-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
        : "after:w-0"
    } after:transition-all after:duration-300`;

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

  const LogoutBtn = (
    <button onClick={handleLogout} className={`${linkClass} text-red-500 hover:text-red-600`}>
      Выйти
    </button>
  );

  const renderLinks = () => {
    // Теперь сравниваем с ROLE_NAMES
    if (currentRoleName === ROLE_NAMES.ANONYMOUS || !currentRoleName) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/public/login">Войти</NavLink>
        </>
      );
    }
    if (currentRoleName === ROLE_NAMES.PATIENT) {
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
    if (currentRoleName === ROLE_NAMES.DOCTOR) {
      return (
        <>
          {/* Можно добавить ссылку на свой профиль врача, если он есть */}
          <NavLink href="/dashboard/doctors/patients">Пациенты</NavLink>
          <NavLink href="/dashboard/doctors/appointments">Приёмы</NavLink>
          <NavLink href="/dashboard/doctors/profile">Профиль</NavLink> {/* Пример */}
          {LogoutBtn}
        </>
      );
    }
    // ADMIN или SUPERADMIN (можно добавить более гранулярные проверки, если нужно)
    if (currentRoleName === ROLE_NAMES.ADMIN || currentRoleName === ROLE_NAMES.SUPERADMIN) {
      return (
        <>
          <NavLink href="/dashboard/doctors">Упр. врачи</NavLink>
          <NavLink href="/dashboard/patients">Упр. пациенты</NavLink>
          <NavLink href="/dashboard/appointments">Упр. приёмы</NavLink>
          <NavLink href="/dashboard/profile">Профиль</NavLink> {/* У админов тоже есть свой профиль пользователя */}
          {LogoutBtn}
        </>
      );
    }
    // На всякий случай, если роль какая-то неизвестная (не должно быть)
    return <NavLink href="/public/login">Войти</NavLink>;
  };

  // Определяем базовый href для логотипа
  let logoHref = "/public/doctors"; // По умолчанию для анонима
 


  return (
    <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href={logoHref} className="text-2xl font-bold text-indigo-600">
          Docker<span className="text-purple-500">Med</span>
        </Link>
        <div className="flex space-x-6">{renderLinks()}</div>
      </div>
    </nav>
  );
}