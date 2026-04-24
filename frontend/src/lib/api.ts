// lib/api.ts
const API_URL = '/api'

// Создаем "бронированную" читалку токена
const getSafeToken = () => {
  // Проверяем именно наличие window, а не localStorage!
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = getSafeToken(); // Юзаем наш сейф-гард ✨

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(API_URL + path, {
    ...opts,
    headers: {
      ...headers,
      ...opts.headers,
    },
  });

  // ... остальная логика (обработка 204, res.json и т.д.)
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}