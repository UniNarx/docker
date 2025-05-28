// server/controllers/patientController.ts
import { Response } from 'express';
import Patient, { IPatient } from '../models/Patient';
import User from '../models/User'; // Может понадобиться для проверки
import { AuthenticatedRequest } from '../middleware/authMiddleware'; // Наш тип запроса с req.user

// @desc    Создать или обновить данные пациента для текущего пользователя
// @route   POST /api/patients/me (или PUT /api/patients/me)
// @access  Private (Patient)
export const upsertMyPatientProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] upsertMyPatientProfile hit. User:', req.user?.id);
  try {
    const { firstName, lastName, dateOfBirth } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      // Это не должно произойти, если protect middleware отработало
      res.status(400).json({ message: 'Пользователь не определен в запросе' });
      return;
    }

    if (!firstName || !lastName || !dateOfBirth) {
      res.status(400).json({ message: 'Имя, фамилия и дата рождения обязательны' });
      return;
    }

    // Проверяем, существует ли уже профиль пациента для этого пользователя
    let patientProfile = await Patient.findOne({ user: userId });

    if (patientProfile) {
      // Обновляем существующий профиль
      patientProfile.firstName = firstName;
      patientProfile.lastName = lastName;
      patientProfile.dateOfBirth = new Date(dateOfBirth); // Убедимся, что это объект Date
      patientProfile = await patientProfile.save();
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} обновлен.`);
      res.status(200).json(patientProfile);
    } else {
      // Создаем новый профиль пациента
      patientProfile = await Patient.create({
        user: userId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
      });
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} создан.`);
      res.status(201).json(patientProfile);
    }
  } catch (error: any) {
    console.error('[PatientController] Ошибка в upsertMyPatientProfile:', error);
    if (error.code === 11000) { // Ошибка дубликата ключа (например, если user уже занят)
        res.status(400).json({ message: 'Профиль пациента для этого пользователя уже существует или другая ошибка уникальности.' });
    } else {
        res.status(500).json({ message: 'Ошибка сервера при создании/обновлении профиля пациента' });
    }
  }
};

// @desc    Получить профиль пациента для текущего пользователя
// @route   GET /api/patients/me
// @access  Private (Patient)
export const getMyPatientProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] getMyPatientProfile hit. User ID:', req.user?.id);
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: 'Пользователь не определен' });
      return;
    }

    const patientProfile = await Patient.findOne({ user: userId }).populate('user', 'username email'); // Популируем данные пользователя
    
    if (!patientProfile) {
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} не найден.`);
      // В Go проекте при регистрации пользователя сразу создавался "пустой" пациент
      // Мы можем сделать так же или просто возвращать 404, если профиль еще не заполнен.
      // Давайте пока вернем 404, если не создан через upsert.
      res.status(404).json({ message: 'Профиль пациента не найден. Пожалуйста, создайте или обновите его.' });
      return;
    }

    res.status(200).json(patientProfile);
  } catch (error: any) {
    console.error('[PatientController] Ошибка в getMyPatientProfile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пациента' });
  }
};

// @desc    Получить всех пациентов (только для Admin/SuperAdmin)
// @route   GET /api/patients
// @access  Private (Admin, SuperAdmin)
export const getAllPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] getAllPatients hit. Requesting user role:', req.user?.roleName);
  try {
    const patients = await Patient.find({}).populate('user', 'username'); // Найти всех, популировать имя пользователя
    res.status(200).json(patients);
  } catch (error: any) {
    console.error('[PatientController] Ошибка в getAllPatients:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка пациентов' });
  }
};

// Другие CRUD операции (getPatientById, updatePatientById, deletePatientById) можно добавить позже.