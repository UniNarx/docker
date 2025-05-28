// server/routes/profileRoutes.ts
import { Router } from 'express';
import { 
    getMyPatientProfileDetails, 
    upsertMyPatientProfileDetails 
} from '../controllers/patientProfileController';
import { 
    getMyDoctorProfileDetails, 
    upsertMyDoctorProfileDetails 
} from '../controllers/doctorProfileController'; // <--- Импортируем контроллеры для DoctorProfile
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[ProfileRoutes] Файл profileRoutes.ts ЗАГРУЖЕН, роутер создан.');

// --- Маршруты для профиля пациента ---
router.route('/patient')
  .get(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getMyPatientProfileDetails)
  .post(protect, authorize(['Patient']), upsertMyPatientProfileDetails);


// --- Маршруты для профиля врача ---
router.route('/doctor')
  .get(protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getMyDoctorProfileDetails) // Врач свой, Админы - любой (если доработать контроллер)
  .post(protect, authorize(['Doctor']), upsertMyDoctorProfileDetails); // Только Врач может создавать/обновлять СВОЙ профиль

export default router;