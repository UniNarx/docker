// server/routes/appointmentRoutes.ts
import { Router } from 'express';
import {
    createAppointment,
    getPatientAppointments,
    cancelAppointment,
    getDoctorAppointments,
    getAppointmentById,      // <--- Импортируем новую функцию
    updateAppointmentStatus  // <--- Импортируем новую функцию
} from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[AppointmentRoutes] Файл appointmentRoutes.ts ЗАГРУЖЕН, роутер создан.');

// /api/appointments/
router.post('/', protect, createAppointment);

// /api/appointments/my
// Этот маршрут должен быть ПЕРЕД '/:id', чтобы 'my' не считался за ID
router.get('/my', protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getPatientAppointments); 

// /api/appointments/doctor/me
// Этот маршрут должен быть ПЕРЕД '/:id', чтобы 'doctor' не считался за ID
router.get('/doctor/me', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getDoctorAppointments);

// /api/appointments/:id/status
// Этот маршрут с параметром и подпутем должен быть ПЕРЕД более общим '/:id' для GET, если они конфликтуют,
// но для PATCH он уникален.
router.patch('/:id/status', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), updateAppointmentStatus);

// /api/appointments/:id/cancel
// Этот маршрут также специфичен
router.patch('/:id/cancel', protect, cancelAppointment); 

// /api/appointments/:id
// Этот маршрут должен идти после более специфичных маршрутов с параметром :id, если такие есть для того же HTTP метода
// В данном случае для GET он уникален после /my и /doctor/me
router.get('/:id', protect, getAppointmentById); 

export default router;