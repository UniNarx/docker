// server/controllers/patientDoctorController.ts
import { Response } from 'express';
import mongoose, { isValidObjectId, Types } from 'mongoose';
import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// @desc    Прикрепить врача к пациенту (и наоборот)
// @route   POST /api/patients/:patientId/assign-doctor/:doctorId
// @access  Private (Admin, SuperAdmin)
export const assignDoctorToPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, doctorId } = req.params;
  console.log(`[PatientDoctorController] assignDoctorToPatient: PatientID=${patientId}, DoctorID=${doctorId}`);

  if (!isValidObjectId(patientId) || !isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID пациента или врача' });
    return;
  }

  try {
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);

    if (!patient) {
      res.status(404).json({ message: `Пациент с ID ${patientId} не найден` });
      return;
    }
    if (!doctor) {
      res.status(404).json({ message: `Врач с ID ${doctorId} не найден` });
      return;
    }

    // Добавляем ID врача в массив assignedDoctors пациента, если его там еще нет
    if (!patient.assignedDoctors?.find(docId => docId.equals(doctor._id))) {
      patient.assignedDoctors = patient.assignedDoctors || [];
      patient.assignedDoctors.push(doctor._id);
      await patient.save();
    }

    // Добавляем ID пациента в массив assignedPatients врача, если его там еще нет
    if (!doctor.assignedPatients?.find(patId => patId.equals(patient._id))) {
      doctor.assignedPatients = doctor.assignedPatients || [];
      doctor.assignedPatients.push(patient._id);
      await doctor.save();
    }

    console.log(`[PatientDoctorController] Врач ${doctorId} прикреплен к пациенту ${patientId}`);
    res.status(200).json({ message: 'Врач успешно прикреплен к пациенту' });

  } catch (error: any) {
    console.error('[PatientDoctorController] Ошибка в assignDoctorToPatient:', error);
    res.status(500).json({ message: 'Ошибка сервера при прикреплении врача к пациенту' });
  }
};

// @desc    Открепить врача от пациента (и наоборот)
// @route   DELETE /api/patients/:patientId/assign-doctor/:doctorId
// @access  Private (Admin, SuperAdmin)
export const unassignDoctorFromPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { patientId, doctorId } = req.params;
  console.log(`[PatientDoctorController] unassignDoctorFromPatient: PatientID=${patientId}, DoctorID=${doctorId}`);

  if (!isValidObjectId(patientId) || !isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID пациента или врача' });
    return;
  }

  try {
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId);

    if (!patient) {
      res.status(404).json({ message: `Пациент с ID ${patientId} не найден` });
      return;
    }
    if (!doctor) {
      res.status(404).json({ message: `Врач с ID ${doctorId} не найден` });
      return;
    }

    // Удаляем ID врача из массива assignedDoctors пациента
    if (patient.assignedDoctors) {
      patient.assignedDoctors = patient.assignedDoctors.filter(docId => !docId.equals(doctor._id));
      await patient.save();
    }

    // Удаляем ID пациента из массива assignedPatients врача
    if (doctor.assignedPatients) {
      doctor.assignedPatients = doctor.assignedPatients.filter(patId => !patId.equals(patient._id));
      await doctor.save();
    }

    console.log(`[PatientDoctorController] Врач ${doctorId} откреплен от пациента ${patientId}`);
    res.status(200).json({ message: 'Врач успешно откреплен от пациента' });

  } catch (error: any) {
    console.error('[PatientDoctorController] Ошибка в unassignDoctorFromPatient:', error);
    res.status(500).json({ message: 'Ошибка сервера при откреплении врача от пациента' });
  }
};


// @desc    Получить всех врачей, прикрепленных к пациенту
// @route   GET /api/patients/:patientId/doctors
// @access  Private (Patient (своих), Doctor (своих пациентов), Admin, SuperAdmin)
export const getAssignedDoctorsForPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientProfileId = req.params.patientId; // ID профиля пациента из URL
  const requestingUser = req.user;
  console.log(`[PatientDoctorController] getAssignedDoctorsForPatient for PatientID: ${patientProfileId}`);

  if (!isValidObjectId(patientProfileId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }

  try {
    const patient = await Patient.findById(patientProfileId).populate({
        path: 'assignedDoctors',
        select: 'firstName lastName specialty user', // Какие поля врачей популировать
        populate: { path: 'user', select: 'username' } // Имя пользователя врача
    });

    if (!patient) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }

    // Проверка прав доступа (пациент может видеть своих врачей, админы - любых)
    let canView = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUser?.roleName!)) {
      canView = true;
    } else if (requestingUser?.roleName === 'Patient') {
      const currentPatientProfile = await Patient.findOne({ user: requestingUser.id });
      if (currentPatientProfile && currentPatientProfile._id.equals(patientProfileId)) {
        canView = true;
      }
    } else if (requestingUser?.roleName === 'Doctor') {
        // TODO: Врач может видеть врачей своих пациентов? Пока нет.
    }


    if (!canView) {
      res.status(403).json({ message: 'Недостаточно прав для просмотра прикрепленных врачей этого пациента' });
      return;
    }

    res.status(200).json(patient.assignedDoctors || []);
  } catch (error: any) {
    console.error('[PatientDoctorController] Ошибка в getAssignedDoctorsForPatient:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка врачей пациента' });
  }
};


// @desc    Получить всех пациентов, прикрепленных к врачу
// @route   GET /api/doctors/:doctorId/patients
// @access  Private (Doctor (своих), Admin, SuperAdmin)
export const getAssignedPatientsForDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorProfileId = req.params.doctorId; // ID профиля врача из URL
  const requestingUser = req.user;
  console.log(`[PatientDoctorController] getAssignedPatientsForDoctor for DoctorID: ${doctorProfileId}`);

  if (!isValidObjectId(doctorProfileId)) {
    res.status(400).json({ message: 'Некорректный ID врача' });
    return;
  }

  try {
    const doctor = await Doctor.findById(doctorProfileId).populate({
        path: 'assignedPatients',
        select: 'firstName lastName dateOfBirth user', // Какие поля пациентов популировать
        populate: { path: 'user', select: 'username' } // Имя пользователя пациента
    });

    if (!doctor) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    // Проверка прав доступа (врач может видеть своих пациентов, админы - любых)
    let canView = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUser?.roleName!)) {
      canView = true;
    } else if (requestingUser?.roleName === 'Doctor') {
      const currentDoctorProfile = await Doctor.findOne({ user: requestingUser.id });
      if (currentDoctorProfile && currentDoctorProfile._id.equals(doctorProfileId)) {
        canView = true;
      }
    }

    if (!canView) {
      res.status(403).json({ message: 'Недостаточно прав для просмотра пациентов этого врача' });
      return;
    }

    res.status(200).json(doctor.assignedPatients || []);
  } catch (error: any) {
    console.error('[PatientDoctorController] Ошибка в getAssignedPatientsForDoctor:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка пациентов врача' });
  }
};