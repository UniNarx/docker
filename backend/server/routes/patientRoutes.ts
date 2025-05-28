// server/routes/patientRoutes.ts
import { Router } from 'express';
import { upsertMyPatientProfile, getMyPatientProfile, getAllPatients } from '../controllers/patientController';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware'; // Для защиты маршрутов по ролям
import { Response } from 'express'; // Для типизации res, если нужно

const router = Router();

console.log('[PatientRoutes] Файл patientRoutes.ts ЗАГРУЖЕН, роутер создан.');

// Маршрут для текущего пользователя (пациента) для управления своим профилем
router.route('/me')
  .post(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), upsertMyPatientProfile) // Пациент может создать/обновить свой профиль
  .get(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getMyPatientProfile);   // Пациент может просмотреть свой профиль

// Маршрут для администраторов для получения всех пациентов
router.route('/') // Это будет /api/patients
  .get(protect, authorize(['Admin', 'SuperAdmin']), getAllPatients);

// Позже можно добавить маршруты для получения пациента по ID, обновления, удаления и т.д.
// router.route('/:id')
//   .get(protect, authorize(['Admin', 'SuperAdmin', 'Doctor']), getPatientById) // Врач тоже может смотреть пациента
//   .put(protect, authorize(['Admin', 'SuperAdmin']), updatePatientById)
//   .delete(protect, authorize(['Admin', 'SuperAdmin']), deletePatientById);

export default router;