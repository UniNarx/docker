/* src/app/layout.tsx */
import './globals.css'
import { ReactNode } from 'react'
import NavBar from '@/components/NavBar'

export const metadata = {
  title: 'DockerMed — Современная Клиника',
  description: 'Ваше здоровье под надежной защитой технологий',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen flex flex-col">
        {/* NavBar будет фиксированным или абсолютным, контент сдвигаем вниз через pt-20 */}
        <NavBar />
        <main className="flex-grow pt-24 pb-12">
          {children}
        </main>
      </body>
    </html>
  )
}