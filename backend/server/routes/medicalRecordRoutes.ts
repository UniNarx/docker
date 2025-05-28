// server/routes/medicalRecordRoutes.ts
import { Router } from 'express';
import {
  createMedicalRecord,
  getMedicalRecordById,
  updateMedicalRecord,  // <--- Импортируем
  deleteMedicalRecord   // <--- Импортируем
} from '../controllers/medicalRecordController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[MedicalRecordRoutes] Файл medicalRecordRoutes.ts ЗАГРУЖЕН, роутер создан.');

// POST /api/medical-records - Создание медицинской записи (только врач)
router.post('/', protect, authorize(['Doctor']), createMedicalRecord);

// GET /api/medical-records/:id - Получение конкретной медицинской записи по ID
router.get('/:id', protect, getMedicalRecordById); // Права проверяются внутри контроллера

// PUT /api/medical-records/:id - Обновление медицинской записи
// (только врач, создавший запись)
router.put('/:id', protect, authorize(['Doctor']), updateMedicalRecord);

// DELETE /api/medical-records/:id - Удаление медицинской записи
// (врач - свою, Admin/SuperAdmin - любую)
router.delete('/:id', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), deleteMedicalRecord);


export default router;