// server/routes/doctorRoutes.ts
import { Router } from 'express';
import { createDoctor, getAllDoctors, getDoctorById } from '../controllers/doctorController';
import { getAssignedPatientsForDoctor } from '../controllers/patientDoctorController'; // <--- Импортируем
import { getDoctorAppointments, getDoctorAvailability } from '../controllers/appointmentController'; // <--- Импортируем getDoctorAvailability
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[DoctorRoutes] Файл doctorRoutes.ts ЗАГРУЖЕН, роутер создан.');

router.post('/', protect, authorize(['Admin', 'SuperAdmin']), createDoctor);
router.get('/', getAllDoctors);

// Маршрут для проверки доступности времени у врача
// GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
router.get('/:doctorId/availability', getDoctorAvailability); // Можно сделать публичным или защитить protect

router.get('/:doctorId/appointments', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getDoctorAppointments);
router.get('/:id', getDoctorById); // Этот маршрут более общий, чем /:doctorId/availability, поэтому /availability должно быть раньше
router.get(
    '/:doctorId/patients',
    protect,
    authorize(['Doctor', 'Admin', 'SuperAdmin']), // Врач своих, Админы - любых
    getAssignedPatientsForDoctor
);

export default router;