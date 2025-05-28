// frontend/lib/authUtils.ts

// Константы имен ролей (если они нужны для сравнения)
export const ROLE_NAMES = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
  SUPERADMIN: "SuperAdmin",
  ANONYMOUS: null, // Или специальная строка, например, "ANONYMOUS"
} as const; // as const делает значения readonly и более строгими для типов

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES] | null;


export interface DecodedJwtPayload {
  userId: string;
  username: string;
  roleId: string;   // ObjectId роли
  roleName: string; // Имя роли
  iat?: number;
  exp?: number;
}

/**
 * Декодирует JWT токен и возвращает его полезную нагрузку (payload).
 * Возвращает null, если токен невалиден или отсутствует.
 */
export function getDecodedToken(tokenString?: string | null): DecodedJwtPayload | null {
  if (!tokenString) {
    return null;
  }
  try {
    const payloadBase64 = tokenString.split(".")[1];
    if (!payloadBase64) {
      return null;
    }
    return JSON.parse(atob(payloadBase64)) as DecodedJwtPayload;
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

/**
 * Получает имя роли из токена.
 */
export function getRoleNameFromToken(tokenString?: string | null): RoleName {
  const decodedToken = getDecodedToken(tokenString);
  return decodedToken?.roleName as RoleName || ROLE_NAMES.ANONYMOUS;
}

/**
 * Получает ID пользователя из токена.
 */
export function getUserIdFromToken(tokenString?: string | null): string | null {
  const decodedToken = getDecodedToken(tokenString);
  return decodedToken?.userId || null;
}

/**
 * Проверяет, аутентифицирован ли пользователь (есть ли валидный токен).
 * Можно добавить проверку срока действия токена (exp).
 */
export function isAuthenticated(tokenString?: string | null): boolean {
  const decodedToken = getDecodedToken(tokenString);
  if (!decodedToken || !decodedToken.exp) {
    return false;
  }
  // Проверяем, не истек ли срок действия токена
  // (exp - это timestamp в секундах, Date.now() - в миллисекундах)
  const срокДействияВМиллисекундах = decodedToken.exp * 1000;
  return срокДействияВМиллисекундах > Date.now();
}

/**
 * Получает токен из localStorage.
 */
export function getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("token");
    }
    return null;
}

/**
 * Сохраняет токен в localStorage и диспатчит событие.
 */
export function saveTokenToStorage(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem("token", token);
        window.dispatchEvent(new CustomEvent("token-changed", { detail: { token } }));
    }
}

/**
 * Удаляет токен из localStorage и диспатчит событие.
 */
export function removeTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("token-changed", { detail: { token: null } }));
    }
}