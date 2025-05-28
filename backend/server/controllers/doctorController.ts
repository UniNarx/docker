// server/controllers/doctorController.ts
import { Request, Response } from 'express';
import Doctor, { IDoctor } from '../models/Doctor';
import User from '../models/User'; // Для создания пользователя-врача
import Role from '../models/Role'; // Для назначения роли "Doctor"
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isValidObjectId } from 'mongoose';


// @desc    Создать нового врача (только Admin/SuperAdmin)
// @route   POST /api/doctors
// @access  Private (Admin, SuperAdmin)
export const createDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[DoctorController] createDoctor hit. Requesting user role:', req.user?.roleName);
  try {
    const { username, password, firstName, lastName, specialty } = req.body;

    if (!username || !password || !firstName || !lastName || !specialty) {
      res.status(400).json({ message: 'Имя пользователя, пароль, имя, фамилия и специализация обязательны' });
      return;
    }

    // 1. Проверяем, не занят ли username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Имя пользователя уже занято' });
      return;
    }

    // 2. Находим роль "Doctor"
    const doctorRole = await Role.findOne({ name: 'Doctor' });
    if (!doctorRole) {
      console.error('[DoctorController] CRITICAL: "Doctor" role not found!');
      res.status(500).json({ message: 'Ошибка сервера: роль "Doctor" не найдена' });
      return;
    }

    // 3. Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Создаем нового пользователя с ролью "Doctor"
    const newUser = new User({
      username,
      passwordHash,
      role: doctorRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[DoctorController] User for doctor ${username} created with ID: ${savedUser._id}`);

    // 5. Создаем профиль врача, связанный с этим пользователем
    const newDoctorProfile = new Doctor({
      user: savedUser._id,
      firstName,
      lastName,
      specialty,
    });
    const savedDoctorProfile = await newDoctorProfile.save();
    console.log(`[DoctorController] Doctor profile for ${firstName} ${lastName} created with ID: ${savedDoctorProfile._id}`);

    // Возвращаем объединенную информацию или только профиль врача
    res.status(201).json({
        message: 'Врач успешно создан',
        doctor: savedDoctorProfile,
        user: { // Возвращаем некоторую информацию о пользователе, но не пароль
            _id: savedUser._id,
            username: savedUser.username,
            role: doctorRole.name
        }
    });

  } catch (error: any) {
    console.error('[DoctorController] Ошибка в createDoctor:', error);
    // Если создание пользователя прошло, а профиля врача нет - нужно откатить создание пользователя (сложнее)
    // Или предусмотреть уникальные индексы и обрабатывать ошибки дубликатов
    if (error.code === 11000) {
        res.status(400).json({ message: 'Ошибка уникальности: пользователь или профиль врача с такими данными уже существует.' });
    } else {
        res.status(500).json({ message: 'Ошибка сервера при создании врача' });
    }
  }
};

// @desc    Получить список всех врачей
// @route   GET /api/doctors
// @access  Public (или Private в зависимости от требований)
// В вашем Go проекте это было публичным маршрутом
export const getAllDoctors = async (req: Request, res: Response): Promise<void> => {
  console.log('[DoctorController] getAllDoctors hit.');
  try {
    // Популируем информацию о пользователе (например, username) и роли
    const doctors = await Doctor.find({})
      .populate({
          path: 'user',
          select: 'username', // Выбираем только нужные поля пользователя
          populate: { // Вложенное популирование для получения имени роли
              path: 'role',
              select: 'name'
          }
      });
    res.status(200).json(doctors);
  } catch (error: any) {
    console.error('[DoctorController] Ошибка в getAllDoctors:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка врачей' });
  }
};

// @desc    Получить информацию о враче по ID
// @route   GET /api/doctors/:id
// @access  Public (или Private)
export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  console.log(`[DoctorController] getDoctorById hit. Doctor ID: ${doctorId}`);
  try {
    const doctor = await Doctor.findById(doctorId)
    .populate({
        path: 'user',
        select: 'username',
        populate: {
            path: 'role',
            select: 'name'
        }
    });

    if (!doctor) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }
    res.status(200).json(doctor);
  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в getDoctorById (ID: ${doctorId}):`, error);
    if (error.kind === 'ObjectId') {
        res.status(400).json({ message: 'Некорректный ID врача' });
        return;
    }
    res.status(500).json({ message: 'Ошибка сервера при получении информации о враче' });
  }
};
export const updateDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  const { firstName, lastName, specialty } = req.body; // Ожидаем camelCase

  console.log(`[DoctorController] updateDoctorById hit. Doctor ID: ${doctorId}`);

  if (!isValidObjectId(doctorId)) { // isValidObjectId из mongoose
    res.status(400).json({ message: 'Некорректный ID врача' });
    return;
  }

  if (!firstName || !lastName || !specialty) {
    res.status(400).json({ message: 'Имя, фамилия и специализация обязательны для обновления' });
    return;
  }

  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    doctor.firstName = firstName;
    doctor.lastName = lastName;
    doctor.specialty = specialty;
    // Не обновляем user или password здесь, это должно делаться через другие эндпоинты

    const updatedDoctor = await doctor.save();
    console.log(`[DoctorController] Doctor profile ID: ${updatedDoctor._id} updated.`);
    res.status(200).json(updatedDoctor);
  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в updateDoctorById (ID: ${doctorId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении данных врача' });
  }
};
export const deleteDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.params.id; // Это ID из модели Doctor (Doctor Profile ID)
  console.log(`[DoctorController] deleteDoctorById hit. Doctor Profile ID: ${doctorId}`);

  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID профиля врача' });
    return;
  }

  try {
    const doctorProfile = await Doctor.findById(doctorId);

    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача не найден' });
      return;
    }

    const userIdToDelete = doctorProfile.user; // Получаем ID пользователя, связанного с этим профилем врача

    // 1. Удаляем профиль врача
    const deletedDoctorProfile = await Doctor.findByIdAndDelete(doctorId);
    if (!deletedDoctorProfile) {
      // Это не должно произойти, если findById нашел его выше, но для подстраховки
      res.status(404).json({ message: 'Профиль врача не найден для удаления (повторно)' });
      return;
    }
    console.log(`[DoctorController] Doctor profile ID: ${doctorId} deleted.`);

    // 2. Удаляем связанного пользователя
    if (userIdToDelete) {
      const deletedUser = await User.findByIdAndDelete(userIdToDelete);
      if (deletedUser) {
        console.log(`[DoctorController] Associated User ID: ${userIdToDelete} deleted.`);
      } else {
        console.warn(`[DoctorController] User ID: ${userIdToDelete} associated with doctor profile ${doctorId} not found or already deleted.`);
      }
    } else {
      console.warn(`[DoctorController] No user ID found in doctor profile ${doctorId} to delete.`);
    }

    // TODO: Потенциально нужно также:
    // - Открепить этого врача от всех пациентов (удалить doctorId из patient.assignedDoctors)
    // - Обработать записи на прием (appointments), связанные с этим врачом (отменить, переназначить?)
    // - Обработать медицинские записи (medical records), созданные этим врачом (обычно они остаются с указанием на удаленного врача, или архивируются)

    res.status(200).json({ message: 'Врач и связанный пользователь успешно удалены' });

  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в deleteDoctorById (Doctor Profile ID: ${doctorId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении врача' });
  }
};
export const getMyDoctorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doctorProfile = await Doctor.findOne({ user: req.user?.id }) // Находим профиль врача по userId из токена
      .populate('user', 'username'); // Опционально популируем пользователя

    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача для текущего пользователя не найден.' });
      return;
    }
    res.status(200).json(doctorProfile);
  } catch (error: any) {
    console.error('[DoctorController] Ошибка в getMyDoctorProfile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля врача' });
  }
};