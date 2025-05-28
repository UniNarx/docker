// server/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Role, { IRole } from '../models/Role';
import Patient from '../models/Patient'; // <--- Добавить импорт
import PatientProfile from '../models/PatientProfile'; // <--- Добавить импорт
import DoctorProfile from '../models/DoctorProfile';
import appConfig from '../config/index';
import jwt from 'jsonwebtoken';    // Убедитесь, что импортирован, если нужен (для login)
import { JwtPayloadWithIds } from '../types/jwt';
import { isValidObjectId } from 'mongoose';

import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord'; 
import { Types } from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {

      console.log('[Register API] Validation failed: username or password missing'); // Лог 3

      res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });

      return;

    }
    const existingUser = await User.findOne({ username });
     if (existingUser) {

      console.log(`[Register API] User ${username} already exists.`); // Лог 5

      res.status(400).json({ message: 'Имя пользователя уже занято' });

      return;

    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const patientRole = await Role.findOne({ name: 'Patient' });
    if (!patientRole) {

      console.error('[Register API] CRITICAL: "Patient" role not found!'); // Лог 9

      res.status(500).json({ message: 'Ошибка сервера: роль по умолчанию не найдена' });

      return;

    }

    const newUser = new User({
      username,
      passwordHash,
      role: patientRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[AuthController] User created with ID: ${savedUser._id}`);

    // --- НОВОЕ: Создание связанной записи Patient ---
    try {
      const newPatientRecord = new Patient({
        user: savedUser._id,
        firstName: '', // Пустое, как в Go (или 'Имя' по умолчанию)
        lastName: '',  // Пустое, как в Go (или 'Фамилия' по умолчанию)
        // dateOfBirth: new Date(), // Или null/undefined, если схема позволяет и не required
                                  // В Go было time.Now(), но для DOB это не всегда логично.
                                  // Лучше оставить поля, которые пользователь должен заполнить.
                                  // Сделаем их необязательными в модели Patient на время, если нужно создать "пустой"
                                  // Или потребуем их на этапе заполнения профиля.
                                  // Сейчас firstName, lastName, dateOfBirth - required в модели Patient.
                                  // Чтобы создать "пустой", нужно сделать их необязательными
                                  // или передать дефолтные валидные значения.
                                  // Давайте пока предположим, что они будут заполнены через /api/patients/me
      });
      await newPatientRecord.save(); // Пока не сохраняем, чтобы не требовать обязательные поля
      console.log(`[AuthController] Empty Patient record created for User ID: ${savedUser._id}`);
      // Вместо этого, пациент сам заполнит свой профиль через /api/patients/me
    } catch (patientError) {
      console.error('[AuthController] Ошибка при создании пустой записи Patient:', patientError);
      // Здесь можно решить, является ли это критической ошибкой для регистрации
    }

    // --- НОВОЕ: Создание связанной записи PatientProfile ---
    try {
      const newPatientProfile = new PatientProfile({
        user: savedUser._id,
      firstName: '', // Теперь это должно быть нормально, если поле не strictly required или имеет default
      lastName: '',  // Аналогично
      dateOfBirth: new Date(),
      });
      await newPatientProfile.save();
      console.log(`[AuthController] Empty PatientProfile created for User ID: ${savedUser._id}`);
    } catch (profileError) {
      console.error('[AuthController] Ошибка при создании PatientProfile:', profileError);
    }
    // --- КОНЕЦ НОВОГО ---


    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: savedUser._id,
      username: savedUser.username,
    });

  } catch (error: any) { // Явно типизируем error как any для доступа к message
    console.error('[Register API] Error caught in register function:', error.message, error.stack); // Лог 14
    // Добавляем проверку, был ли уже отправлен ответ
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при регистрации пользователя (из catch)' });
    } else {
      console.error('[Register API] Headers already sent, cannot send error JSON.');
    }
    return;
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log("[ChangePassword Controller] Received req.body:", JSON.stringify(req.body, null, 2)); // <--- НОВЫЙ ЛОГ

  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body; // Ожидаем camelCase

  if (!oldPassword || !newPassword) {
        console.warn("[ChangePassword Controller] Validation failed: oldPassword or newPassword is missing or empty."); // <--- НОВЫЙ ЛОГ ДЛЯ ОШИБКИ

    res.status(400).json({ message: 'Старый и новый пароли обязательны' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' }); // Хотя protect должен это предотвратить
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Неверный старый пароль' });
      return;
    }

    if (newPassword.length < 6) { // Пример валидации длины на бэкенде
        res.status(400).json({ message: 'Новый пароль должен быть не менее 6 символов.' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Пароль успешно изменен' }); // Или 204 No Content
  } catch (error: any) {
    console.error('[AuthController] Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера при смене пароля' });
  }
};
// login функция остается как есть (убедитесь, что в ней тоже есть подробное логгирование и return;)
export const login = async (req: Request, res: Response): Promise<void> => {
  console.log('[Login API] Entered login function');
  try {
    const { username, password } = req.body;
    console.log(`[Login API] Received username: ${username}, password: ${password ? '***' : 'undefined'}`);

    if (!username || !password) {
      console.log('[Login API] Validation failed: username or password missing');
      res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });
      return;
    }

    console.log(`[Login API] Looking for user: ${username}`);
    const user = await User.findOne({ username }).populate('role');

    if (!user) {
      console.log(`[Login API] User ${username} not found.`);
      res.status(401).json({ message: 'Неверные учетные данные (пользователь не найден)' });
      return;
    }
    console.log(`[Login API] User ${username} found.`);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`[Login API] Password mismatch for user ${username}.`);
      res.status(401).json({ message: 'Неверные учетные данные (пароль не совпадает)' });
      return;
    }
    console.log(`[Login API] Password matches for user ${username}.`);

    if (!user.role || typeof (user.role as IRole).name === 'undefined') { // Убедимся, что роль и ее имя существуют
    console.error(`[Login API] CRITICAL: Role name for user ${user.username} not found after populate.`);
    res.status(500).json({ message: 'Ошибка сервера: не удалось определить имя роли пользователя' });
    return;
}

const payload: JwtPayloadWithIds = {
    userId: user._id.toString(),
    username: user.username,
    roleId: (user.role as IRole)._id.toString(), // Оставляем ObjectId роли, если он где-то нужен
    roleName: (user.role as IRole).name,       // <--- ДОБАВЛЯЕМ ИМЯ РОЛИ
};

const token = jwt.sign(
    payload,
    appConfig.jwtSecret,
    { expiresIn: '24h' }
);

res.json({
    message: 'Вход выполнен успешно',
    token,
    user: {
        id: user._id,
        username: user.username,
        role: (user.role as IRole).name // Имя роли также в ответе login
    }
});
    console.log(`[Login API] Sent 200 response for ${username}.`);
    return;

  } catch (error: any) {
    console.error('[Login API] Error caught in login function:', error.message, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при входе пользователя (из catch)' });
    } else {
      console.error('[Login API] Headers already sent, cannot send error JSON.');
    }
    return;
  }
};

export const registerAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AuthController] registerAdmin hit by User ID:', req.user?.id, 'Role:', req.user?.roleName);
  try {
    const { username, password, role: roleName } = req.body; // Ожидаем username, password, role (имя роли)

    if (!username || !password || !roleName) {
      res.status(400).json({ message: 'Имя пользователя, пароль и роль обязательны.' });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Имя пользователя уже занято.' });
      return;
    }

    const targetRole = await Role.findOne({ name: roleName });
    if (!targetRole) {
      res.status(400).json({ message: `Роль "${roleName}" не найдена.` });
      return;
    }

    // Валидация пароля (например, минимальная длина)
    if (password.length < 6) {
         res.status(400).json({ message: 'Пароль должен быть не менее 6 символов.' });
         return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      passwordHash,
      role: targetRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[AuthController] User ${username} created with role ${roleName} by admin.`);

    // Если создается Patient или Doctor, нужно также создать связанные профили
    if (roleName === 'Patient') {
      const newPatientRecord = new Patient({
        user: savedUser._id,
        firstName: '', // Можно оставить пустыми или взять из req.body, если они там есть
        lastName: '',
        dateOfBirth: new Date(0), // Или сделать необязательным в модели Patient
      });
      await newPatientRecord.save();
      // Также можно создать PatientProfile
      const newPatientProfile = new PatientProfile({ user: savedUser._id });
      await newPatientProfile.save();
      console.log(`[AuthController] Patient record and profile created for new user ${username}`);
    } else if (roleName === 'Doctor') {
      // Для создания Doctor требуются firstName, lastName, specialty.
      // Их нужно либо передавать с фронтенда, либо этот эндпоинт не должен создавать Doctor напрямую,
      // а использовать /api/doctors POST, который уже принимает эти поля.
      // Пока оставим это как TODO или потребуем доп. поля от фронтенда.
      // Для простоты, если создается Doctor через этот эндпоинт, нужно будет потом отдельно заполнить его профиль.
      console.warn(`[AuthController] Doctor user ${username} created. Doctor profile (firstName, lastName, specialty) needs to be created separately.`);
      // Можно создать пустой DoctorProfile, если это имеет смысл
      const newDoctorProfile = new DoctorProfile({ user: savedUser._id });
      await newDoctorProfile.save();
    }

    res.status(201).json({
      message: `Пользователь "<span class="math-inline">\{username\}" с ролью "</span>{roleName}" успешно создан.`,
      userId: savedUser._id,
      username: savedUser.username,
      role: targetRole.name,
    });

  } catch (error: any) {
    console.error('[AuthController] Ошибка в registerAdmin:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Имя пользователя уже существует (ошибка БД).' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера при создании пользователя.' });
    }
  }
};

export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};
    const { roleName, roleId } = req.query; // Принимаем roleName или roleId

    if (roleName && typeof roleName === 'string') {
      const roleDoc = await Role.findOne({ name: roleName });
      if (roleDoc) {
        query.role = roleDoc._id;
      } else {
        res.status(200).json([]); // Роль не найдена, возвращаем пустой массив
        return;
      }
    } else if (roleId && typeof roleId === 'string' && isValidObjectId(roleId)) {
        query.role = roleId;
    }

    // Находим пользователей по критерию (или всех, если критериев нет)
    // Исключаем пароль и другие чувствительные данные
    const users = await User.find(query).select('-passwordHash').populate('role', 'name');

    // Преобразуем для фронтенда, чтобы ID были строками и включали roleName
    const userList = users.map(u => ({
        _id: u._id.toString(),
        id: u._id.toString(), // для совместимости
        username: u.username,
        roleId: (u.role as IRole)._id.toString(),
        roleName: (u.role as IRole).name,
        createdAt: u.createdAt.toISOString(), // Отправляем дату в ISO
    }));

    res.status(200).json(userList);
  } catch (error: any) {
    console.error("Ошибка получения списка пользователей:", error);
    res.status(500).json({ message: "Ошибка сервера при получении списка пользователей." });
  }
};
export const deleteUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userIdToDelete = req.params.userId;
  const requestingUserId = req.user?.id; // ID того, кто делает запрос

  console.log(`[AuthController] Attempting to delete user ID: ${userIdToDelete} by user ID: ${requestingUserId}`);

  if (!isValidObjectId(userIdToDelete)) {
    res.status(400).json({ message: 'Некорректный ID пользователя для удаления.' });
    return;
  }

  // СуперАдмин не может удалить сам себя через этот эндпоинт (для безопасности)
  if (userIdToDelete === requestingUserId) {
    res.status(400).json({ message: 'Вы не можете удалить свой собственный аккаунт через этот интерфейс.' });
    return;
  }

  try {
    const userToDelete = await User.findById(userIdToDelete).populate('role'); // Популируем роль для проверки
    if (!userToDelete) {
      res.status(404).json({ message: 'Пользователь для удаления не найден.' });
      return;
    }

    const userRoleName = (userToDelete.role as IRole)?.name;

    // Опционально: СуперАдмин не может удалить другого СуперАдмина (кроме себя, что уже запрещено)
    // if (userRoleName === 'SuperAdmin' && userIdToDelete !== requestingUserId) {
    //   res.status(403).json({ message: 'Запрещено удалять других СуперАдминистраторов.' });
    //   return;
    // }

    // Начало "каскадного" удаления (упрощенный вариант)
    // В реальном приложении это лучше делать через транзакции или более сложные сервисы

    if (userRoleName === 'Patient') {
      const patientProfileDoc = await Patient.findOne({ user: userToDelete._id });
      if (patientProfileDoc) {
        await Appointment.deleteMany({ patient: patientProfileDoc._id });
        await MedicalRecord.deleteMany({ patient: patientProfileDoc._id });
        await Patient.deleteOne({ _id: patientProfileDoc._id });
        console.log(`[AuthController] Associated Patient data for user ${userIdToDelete} deleted.`);
      }
      await PatientProfile.deleteOne({ user: userToDelete._id });
      console.log(`[AuthController] Associated PatientProfile for user ${userIdToDelete} deleted.`);
    } else if (userRoleName === 'Doctor') {
      const doctorProfileDoc = await Doctor.findOne({ user: userToDelete._id });
      if (doctorProfileDoc) {
        // Что делать с записями, где этот врач был назначен? Отменить? Переназначить?
        // Пока просто удаляем записи, где он основной врач. Пациенты остаются привязанными к другим врачам.
        // await Appointment.updateMany({ doctor: doctorProfileDoc._id }, { status: AppointmentStatus.CANCELLED /* или другое */ });
        // Или удалить только его будущие приемы
        await Appointment.deleteMany({ doctor: doctorProfileDoc._id }); // Осторожно! Удалит все его приемы.
        // Пациенты, привязанные к этому врачу, в их документах останется ссылка на удаленного врача.
        // Это нужно будет обработать отдельно (например, убрать его из assignedDoctors у пациентов).
        // MedicalRecord, созданные этим врачом, обычно остаются.
        await Doctor.deleteOne({ _id: doctorProfileDoc._id });
        console.log(`[AuthController] Associated Doctor data for user ${userIdToDelete} deleted.`);
      }
      await DoctorProfile.deleteOne({ user: userToDelete._id });
       console.log(`[AuthController] Associated DoctorProfile for user ${userIdToDelete} deleted.`);
    }
    // Для роли Admin может не быть специфичных связанных данных, кроме самого User.

    await User.findByIdAndDelete(userIdToDelete);
    console.log(`[AuthController] User ID: ${userIdToDelete} deleted successfully.`);
    res.status(200).json({ message: `Пользователь ${userToDelete.username} и связанные данные успешно удалены.` });

  } catch (error: any) {
    console.error(`[AuthController] Ошибка при удалении пользователя ${userIdToDelete}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.' });
  }
};