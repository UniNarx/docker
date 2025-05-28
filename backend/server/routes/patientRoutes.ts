// server/routes/patientRoutes.ts
import { Router } from 'express';
import { upsertMyPatientProfile, getMyPatientProfile, getAllPatients } from '../controllers/patientController';
import { 
    assignDoctorToPatient, 
    unassignDoctorFromPatient,
    getAssignedDoctorsForPatient
} from '../controllers/patientDoctorController';
import { getPatientAppointments } from '../controllers/appointmentController';
import { getMedicalRecordsByPatient } from '../controllers/medicalRecordController'; // <--- Импортируем
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[PatientRoutes] Файл patientRoutes.ts ЗАГРУЖЕН, роутер создан.');

router.route('/me')
  .post(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), upsertMyPatientProfile)
  .get(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getMyPatientProfile);

router.route('/')
  .get(protect, authorize(['Admin', 'SuperAdmin']), getAllPatients);

router.get(
    '/:patientId/appointments',
    protect,
    authorize(['Patient', 'Doctor', 'Admin', 'SuperAdmin']), // Уточнил права, пациент тоже может свои смотреть так
    getPatientAppointments
);

// Новый маршрут для получения медицинских записей конкретного пациента
// GET /api/patients/:patientId/medical-records
router.get(
    '/:patientId/medical-records',
    protect,
    // Права доступа: Пациент (свои), Врач (пока все, потом ограничить), Admin, SuperAdmin
    authorize(['Patient', 'Doctor', 'Admin', 'SuperAdmin']),
    getMedicalRecordsByPatient
);

router.post(
    '/:patientId/assign-doctor/:doctorId',
    protect,
    authorize(['Admin', 'SuperAdmin']),
    assignDoctorToPatient
);

// DELETE /api/patients/:patientId/assign-doctor/:doctorId
router.delete(
    '/:patientId/assign-doctor/:doctorId',
    protect,
    authorize(['Admin', 'SuperAdmin']),
    unassignDoctorFromPatient
);

// GET /api/patients/:patientId/doctors
router.get(
    '/:patientId/doctors',
    protect,
    authorize(['Patient', 'Admin', 'SuperAdmin', 'Doctor']), // Пациент свой, Доктор своих пациентов (доп. логика в контроллере)
    getAssignedDoctorsForPatient
);

export default router;