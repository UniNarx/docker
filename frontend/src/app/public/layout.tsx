// src/app/public/layout.tsx
import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  // сюда можно добавить какой-то footer или общие стили
  return <div className="pt-4">{children}</div>
}
