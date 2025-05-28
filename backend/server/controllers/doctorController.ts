// server/controllers/doctorController.ts
import { Request, Response } from 'express';
import Doctor, { IDoctor } from '../models/Doctor';
import User from '../models/User'; // Для создания пользователя-врача
import Role from '../models/Role'; // Для назначения роли "Doctor"
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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

// TODO: Добавить updateDoctor, deleteDoctor, getDoctorProfile (для залогиненного врача - /api/doctors/me)