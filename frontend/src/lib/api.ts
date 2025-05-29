// lib/api.ts
const API_URL = '/api'


// lib/api.ts
export async function apiFetch<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(API_URL + path, {
    ...opts,
    headers,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }

  // Если нет контента — возвращаем null (привести к T)
  if (res.status === 204) {
    // @ts-ignore
    return null
  }

  return (await res.json()) as T
}

