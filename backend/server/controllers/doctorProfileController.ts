// server/controllers/doctorProfileController.ts
import { Response } from 'express';
import mongoose, { Types } from 'mongoose'; // Импортируем Types для ObjectId
import DoctorProfile, { IDoctorProfile } from '../models/DoctorProfile';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Doctor from '../models/Doctor'; // Для проверки, что пользователь является врачом

// @desc    Получить профиль врача для текущего аутентифицированного пользователя-врача
// @route   GET /api/profiles/doctor
// @access  Private (Doctor)
export const getMyDoctorProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[DoctorProfileController] getMyDoctorProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }
  // Убедимся, что userId - это валидный ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Некорректный формат User ID' });
      return;
  }

  // Дополнительная проверка: является ли текущий пользователь врачом (имеет запись в коллекции Doctors)
  const doctorRecord = await Doctor.findOne({ user: userId as unknown as Types.ObjectId });
  if (!doctorRecord) {
      res.status(403).json({ message: 'Доступ запрещен: только врачи могут просматривать/создавать профили врачей.' });
      return;
  }

  try {
    const profile = await DoctorProfile.findOne({ user: userId as unknown as Types.ObjectId });
    if (!profile) {
      res.status(404).json({ message: 'Профиль врача не найден. Создайте его.' });
      return;
    }
    res.status(200).json(profile);
  } catch (error: any) {
    console.error('[DoctorProfileController] Error in getMyDoctorProfileDetails:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля врача' });
  }
};

// @desc    Создать или обновить профиль врача для текущего пользователя-врача
// @route   POST /api/profiles/doctor (Upsert)
// @access  Private (Doctor)
export const upsertMyDoctorProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[DoctorProfileController] upsertMyDoctorProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Некорректный формат User ID для профиля' });
    return;
  }

  // Дополнительная проверка: является ли текущий пользователь врачом
  const doctorRecord = await Doctor.findOne({ user: userId as unknown as Types.ObjectId });
  if (!doctorRecord) {
      res.status(403).json({ message: 'Доступ запрещен: только врачи могут создавать/обновлять профили врачей.' });
      return;
  }

  try {
    // const { biography, officeHours } = req.body; // Пример полей, если они будут
    // Пока что профиль минималистичный, тело запроса может быть пустым
    // или содержать поля, которые вы добавите в IDoctorProfile и DoctorProfileSchema

    const profileData: Partial<IDoctorProfile> = { user: userId as any };
    // if (biography) profileData.biography = biography;
    // if (officeHours) profileData.officeHours = officeHours;
    
    const existingProfile = await DoctorProfile.findOne({ user: userId as unknown as Types.ObjectId });

    const updatedProfile = await DoctorProfile.findOneAndUpdate(
      { user: userId as unknown as Types.ObjectId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (!updatedProfile) {
        res.status(500).json({ message: 'Не удалось создать или обновить профиль врача' });
        return;
    }

    const statusCode = existingProfile ? 200 : 201;
    const actionMessage = existingProfile ? 'updated' : 'created';

    console.log(`[DoctorProfileController] Doctor Profile for user ${userId} ${actionMessage}.`);
    res.status(statusCode).json(updatedProfile);

  } catch (error: any) {
    console.error('[DoctorProfileController] Error in upsertMyDoctorProfileDetails:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ошибка уникальности (профиль для этого пользователя-врача уже существует)' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера при создании/обновлении профиля врача' });
    }
  }
};