/* src/app/page.tsx */
'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import { Stethoscope, Award, Search, User } from 'lucide-react'

type Doctor = { 
  id: number, 
  first_name: string, 
  last_name: string, 
  specialty: string 
}

export default function PublicDoctorsPage() {
  const [docs, setDocs] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiFetch<Doctor[]>('/doctors')
      .then(setDocs)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6">
      {/* Header */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
        >
          <Stethoscope size={14} /> Наша команда
        </motion.div>
        <h1 className="text-5xl font-black text-[#1e3a8a] tracking-tighter mb-4">Наши специалисты</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm font-medium">
          В DockerMed работают только сертифицированные врачи в передовых областях медицины.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docs.map((d, index) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[35px] p-8 shadow-xl shadow-slate-900/5 border-4 border-white hover:border-indigo-50 transition-all group"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 mb-6 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">
                <User size={40} />
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                <Award size={12} /> {d.specialty}
              </div>
              
              <h3 className="text-2xl font-black text-[#1e3a8a] tracking-tight mb-2">
                {d.first_name} <br /> {d.last_name}
              </h3>
              
              <p className="text-slate-400 text-xs font-medium mb-8 leading-relaxed">
                Специалист высшей категории, эксперт в области {d.specialty.toLowerCase()}.
              </p>

              <button className="w-full py-4 bg-slate-50 text-[#1e3a8a] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1e3a8a] hover:text-white transition-all">
                Записаться на прием
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}