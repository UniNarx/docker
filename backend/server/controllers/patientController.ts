// backend/server/controllers/patientController.ts
import { Response } from 'express';
import mongoose, { isValidObjectId } from 'mongoose'; // Убедитесь, что isValidObjectId импортирован
import Patient, { IPatient } from '../models/Patient';
import User from '../models/User'; // Для удаления связанного пользователя
import Appointment from '../models/Appointment'; // Для удаления связанных записей на прием
import MedicalRecord from '../models/MedicalRecord'; // Для удаления связанных медкарт
import PatientProfile from '../models/PatientProfile'; // Для удаления связанного PatientProfile
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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
export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientId = req.params.id;
  if (!isValidObjectId(patientId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }
  try {
    const patient = await Patient.findById(patientId).populate('user', 'username'); // Опционально
    if (!patient) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }
    res.status(200).json(patient);
  } catch (error: any) {
    console.error(`[PatientController] Ошибка в getPatientById (ID: ${patientId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных пациента' });
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
export const deletePatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientId = req.params.id; // Это ID из модели Patient
  console.log(`[PatientController] deletePatientById hit. Patient ID: ${patientId}`);

  if (!isValidObjectId(patientId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }

  try {
    const patientToDelete = await Patient.findById(patientId);

    if (!patientToDelete) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }

    const userId = patientToDelete.user; // ID пользователя, связанного с этим пациентом

    // Начало транзакции (если ваша БД поддерживает их, например, реплика MongoDB)
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      // 1. Удалить связанные записи на прием
      await Appointment.deleteMany({ patient: patientId }/*, { session }*/);
      console.log(`[PatientController] Appointments for patient ${patientId} deleted.`);

      // 2. Удалить связанные медицинские карты
      await MedicalRecord.deleteMany({ patient: patientId }/*, { session }*/);
      console.log(`[PatientController] Medical records for patient ${patientId} deleted.`);
      
      // 3. Удалить связанный PatientProfile (если он есть и связан по user ID)
      if (userId) {
        await PatientProfile.deleteOne({ user: userId }/*, { session }*/);
        console.log(`[PatientController] PatientProfile for user ${userId} deleted.`);
      }

      // 4. Удалить саму запись пациента
      await Patient.findByIdAndDelete(patientId /*, { session }*/);
      console.log(`[PatientController] Patient record ${patientId} deleted.`);

      // 5. Удалить связанного пользователя (User)
      if (userId) {
        await User.findByIdAndDelete(userId /*, { session }*/);
        console.log(`[PatientController] User record ${userId} for patient ${patientId} deleted.`);
      }

      // await session.commitTransaction();
      res.status(200).json({ message: 'Пациент и все связанные с ним данные успешно удалены' });

    } catch (transactionError: any) {
      // await session.abortTransaction();
      console.error(`[PatientController] Ошибка транзакции при удалении пациента ${patientId}:`, transactionError);
      res.status(500).json({ message: 'Ошибка сервера при удалении связанных данных пациента' });
    } /*finally {
      session.endSession();
    }*/

  } catch (error: any) {
    console.error(`[PatientController] Ошибка при поиске пациента ${patientId} для удаления:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пациента' });
  }
};