// src/app/dashboard/doctors/patients/[patientId]/medical_records/[recordId]/edit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'

// Тип для данных медкарты
type MedicalRecordData = {
  _id: string; // Ожидаем _id от бэкенда
  id?: string;  // Mongoose virtual id
  patientId: string; // было patient_id, теперь строка ObjectId
  doctorId: string;  // было doctor_id, теперь строка ObjectId
  visitDate: string; // было visit_date (строка YYYY-MM-DD или ISO)
  notes?: string;
  attachments?: string[];
};

export default function EditMedicalRecordPage() {
  const params = useParams();
  // patientIdParam здесь не используется для загрузки/сохранения самой записи, но может быть полезен для навигации
  // const patientIdParam = Array.isArray(params.patientId) ? params.patientId[0] : params.patientId;
  const recordIdParam = Array.isArray(params.recordId) ? params.recordId[0] : params.recordId;

  const router = useRouter();

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordData | null>(null);
  const [notes, setNotes]                 = useState('');
  const [visitDate, setVisitDate]         = useState(''); // Формат YYYY-MM-DD для input
  // Для управления вложениями (если нужно будет их редактировать)
  // const [currentAttachments, setCurrentAttachments] = useState<string[]>([]);

  const [saving, setSaving]               = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);


  /* — стили «glass & dark» — */
  const glassCard  = "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const glassInput = "w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const btnBase    = "px-4 py-2 rounded-lg font-medium transition-colors";
  const btnSave    = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50";
  const btnDelete  = "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-pink-500 hover:to-red-500 disabled:opacity-50";
  const linkCancel = "text-indigo-300 hover:underline";

  /* — Загрузка медицинской записи — */
  useEffect(() => {
    if (!recordIdParam) {
      setError("ID медицинской записи не найден в URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    apiFetch<MedicalRecordData>(`/medical-records/${recordIdParam}`)
      .then(data => {
        if (!data) throw new Error("Медицинская запись не найдена.");
        setMedicalRecord(data);
        // API возвращает дату как строку (обычно ISO), берем только YYYY-MM-DD для input type="date"
        setVisitDate(data.visitDate ? data.visitDate.slice(0, 10) : '');
        setNotes(data.notes ?? '');
        // setCurrentAttachments(data.attachments ?? []);
      })
      .catch(e => {
        console.error(`Ошибка загрузки медкарты ${recordIdParam}:`, e);
        setError(e.message);
      })
      .finally(() => setIsLoading(false));
  }, [recordIdParam]);

  /* — Сохранение изменений — */
  const handleSave = async () => {
    if (!visitDate) {
      alert('Укажите дату визита');
      return;
    }
    if (!medicalRecord) {
        alert('Данные медкарты не загружены.');
        return;
    }
    setSaving(true);
    setError(null);
    try {
      // Бэкенд (updateMedicalRecord) ожидает visitDate, notes, attachments
      await apiFetch<void>(`/medical-records/${medicalRecord._id || medicalRecord.id}`, { // Используем _id или id из загруженной записи
        method: 'PUT',
        body: JSON.stringify({
          visitDate: visitDate,       // было visit_date
          notes,
          attachments: medicalRecord.attachments ?? [], // Отправляем текущие вложения (редактирование самих файлов - отдельная задача)
        }),
      });
      alert('Медицинская запись успешно сохранена!');
      router.back(); // Возвращаемся на предыдущую страницу
    } catch (e: any) {
      console.error("Ошибка сохранения медкарты:", e);
      setError(e.message);
      alert('Ошибка при сохранении: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  /* — Удаление медицинской записи — */
  const handleDelete = async () => {
    if (!medicalRecord || !(medicalRecord._id || medicalRecord.id)) {
        alert('Данные медкарты не загружены или ID отсутствует.');
        return;
    }
    if (!confirm('Удалить эту медицинскую запись безвозвратно?')) return;
    setSaving(true); // Блокируем кнопки на время удаления
    setError(null);
    try {
      await apiFetch<void>(`/medical-records/${medicalRecord._id || medicalRecord.id}`, { method: 'DELETE' });
      alert('Медицинская запись удалена.');
      router.back(); // или router.push(`/dashboard/doctors/patients/${patientIdParam}`);
    } catch (e: any) {
      console.error("Ошибка удаления медкарты:", e);
      setError(e.message);
      alert('Ошибка при удалении: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="p-4 text-center text-gray-300">Загрузка медицинской записи...</p>;
  if (error) return <p className="p-4 text-center text-red-400">{error}</p>;
  if (!medicalRecord) return <p className="p-4 text-center text-gray-300">Медицинская запись не найдена.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 flex items-center justify-center !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-xl w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          Редактирование записи #{medicalRecord._id || medicalRecord.id}
        </h1>

        <label className="block space-y-1">
          <span className="font-medium">Дата визита</span>
          <input
            type="date"
            value={visitDate}
            onChange={e => setVisitDate(e.target.value)}
            className={glassInput}
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="font-medium">Заметки</span>
          <textarea
            rows={6} // Увеличил немного
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={`${glassInput} resize-y`}
            placeholder="Введите заметки, диагноз, назначения..."
          />
        </label>

        {/* TODO: Добавить интерфейс для управления вложениями (просмотр, удаление, добавление новых) */}
        {/* medicalRecord.attachments */}

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className={`${btnBase} ${btnSave} w-full sm:w-auto flex-grow`}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>

          <button
            onClick={handleDelete}
            disabled={saving || isLoading}
            className={`${btnBase} ${btnDelete} w-full sm:w-auto`}
          >
            Удалить
          </button>

          <button
            onClick={() => router.back()}
            className={`${linkCancel} w-full sm:w-auto py-2 text-center`} // Стилизовал как кнопку для консистентности
            disabled={saving || isLoading}
          >
            Отмена
          </button>
        </div>
      </motion.div>
    </div>
  );
}