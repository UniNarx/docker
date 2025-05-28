// server/routes/patientRoutes.ts
import { Router } from "express";
import {
  upsertMyPatientProfile,
  getMyPatientProfile,
  getAllPatients,
  deletePatientById,
  getPatientById,
} from "../controllers/patientController";
import {
  assignDoctorToPatient,
  unassignDoctorFromPatient,
  getAssignedDoctorsForPatient,
} from "../controllers/patientDoctorController";
import { getPatientAppointments } from "../controllers/appointmentController";
import { getMedicalRecordsByPatient } from "../controllers/medicalRecordController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";

const router = Router();

console.log("[PatientRoutes] Файл patientRoutes.ts ЗАГРУЖЕН, роутер создан.");

// 1. Самый специфичный маршрут - /me
router
  .route("/me")
  .get(
    protect,
    authorize(["Patient", "Admin", "SuperAdmin"]),
    getMyPatientProfile
  )
  .put(
    protect,
    authorize(["Patient", "Admin", "SuperAdmin"]),
    upsertMyPatientProfile
  );

// 2. Маршрут для корневого пути /api/patients/
router
  .route("/")
  .get(protect, authorize(["Admin", "SuperAdmin"]), getAllPatients);

// 3. Маршруты с двумя параметрами или очень специфичными суффиксами
router.post(
  "/:patientId/assign-doctor/:doctorId",
  protect,
  authorize(["Admin", "SuperAdmin"]),
  assignDoctorToPatient
);

router.delete(
  "/:patientId/assign-doctor/:doctorId",
  protect,
  authorize(["Admin", "SuperAdmin"]),
  unassignDoctorFromPatient
);

// 4. Маршруты с одним параметром и специфичными суффиксами
router.get(
  "/:patientId/appointments",
  protect,
  authorize(["Patient", "Doctor", "Admin", "SuperAdmin"]),
  getPatientAppointments
);

router.get(
  "/:patientId/medical-records",
  protect,
  authorize(["Patient", "Doctor", "Admin", "SuperAdmin"]),
  getMedicalRecordsByPatient
);

router.get(
  "/:patientId/doctors",
  protect,
  authorize(["Patient", "Admin", "SuperAdmin", "Doctor"]),
  getAssignedDoctorsForPatient
);

// 5. Более общие маршруты с одним параметром (/:id) должны идти в конце.
// Если у вас есть GET /:id и DELETE /:id, их можно сгруппировать.
router
  .route("/:id")
  .get(protect, authorize(["Doctor", "Admin", "SuperAdmin"]), getPatientById) // Врач может смотреть пациентов (нужна доп. логика в контроллере для "своих"), админ - любых
  .delete(
    protect,
    authorize(["Admin", "SuperAdmin"]),
    deletePatientById
  );

export default router;