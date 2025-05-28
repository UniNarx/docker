// server/routes/profileRoutes.ts
import { Router } from 'express';
import {
    getMyPatientProfileDetails,
    upsertMyPatientProfileDetails
} from '../controllers/patientProfileController';
import {
    getMyDoctorProfileDetails,
    upsertMyDoctorProfileDetails
} from '../controllers/doctorProfileController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[ProfileRoutes] Файл profileRoutes.ts ЗАГРУЖЕН, роутер создан.');

// --- Маршруты для профиля пациента (/api/profiles/patient) ---
router.route('/patient')
  .get(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getMyPatientProfileDetails)
  .post(protect, authorize(['Patient']), upsertMyPatientProfileDetails)  // Для создания (если профиля нет)
  .put(protect, authorize(['Patient']), upsertMyPatientProfileDetails);   // Для обновления существующего профиля

// --- Маршруты для профиля врача (/api/profiles/doctor) ---
router.route('/doctor')
  .get(protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getMyDoctorProfileDetails)
  .post(protect, authorize(['Doctor']), upsertMyDoctorProfileDetails) // Для создания
  .put(protect, authorize(['Doctor']), upsertMyDoctorProfileDetails);  // Для обновления (если потребуется)

export default router;