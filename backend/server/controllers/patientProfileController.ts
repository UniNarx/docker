// server/controllers/patientProfileController.ts
import { Response } from 'express';
import mongoose, { Types } from 'mongoose'; // Импортируем Types для ObjectId
import PatientProfile, { IPatientProfile, Gender } from '../models/PatientProfile';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// @desc    Получить профиль пациента для текущего пользователя
// @route   GET /api/profiles/patient
// @access  Private (Patient)
export const getMyPatientProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[PatientProfileController] getMyPatientProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }

  try {
    // Убедимся, что userId - это валидный ObjectId перед поиском
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'Некорректный формат User ID' });
        return;
    }
    const profile = await PatientProfile.findOne({ user: userId as unknown as Types.ObjectId }); // Приводим к Types.ObjectId
    if (!profile) {
      res.status(404).json({ message: 'Профиль пациента не найден. Создайте его.' });
      return;
    }
    res.status(200).json(profile);
  } catch (error: any) {
    console.error('[PatientProfileController] Error in getMyPatientProfileDetails:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пациента' });
  }
};

// @desc    Создать или обновить профиль пациента для текущего пользователя
// @route   POST /api/profiles/patient (Upsert)
// @access  Private (Patient)
export const upsertMyPatientProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[PatientProfileController] upsertMyPatientProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }
   // Убедимся, что userId - это валидный ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Некорректный формат User ID для профиля' });
    return;
  }

  try {
    const { dob, gender } = req.body;

    if (gender && !Object.values(Gender).includes(gender as Gender)) {
        res.status(400).json({ message: `Некорректное значение для gender. Допустимые: ${Object.values(Gender).join(', ')}` });
        return;
    }
    
    let dobDate;
    if (dob) {
        dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
            res.status(400).json({ message: 'Некорректный формат даты рождения (dob)' });
            return;
        }
    }

    // Данные для создания/обновления. Mongoose сам преобразует строку userId в ObjectId для поля user.
    const profileData: Partial<IPatientProfile> = { user: userId as any }; // userId - строка, Mongoose преобразует
    if (dobDate) profileData.dob = dobDate;
    if (gender) profileData.gender = gender as Gender;

    const existingProfile = await PatientProfile.findOne({ user: userId as unknown as Types.ObjectId });

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { user: userId as unknown as Types.ObjectId }, // Поиск по user ID
      { $set: profileData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (!updatedProfile) {
        // Это не должно произойти с upsert:true, но на всякий случай
        res.status(500).json({ message: 'Не удалось создать или обновить профиль' });
        return;
    }
    
    // Определяем, был ли профиль создан или обновлен
    // Если existingProfile был null, значит, профиль был создан.
    // Или можно сравнить createdAt и updatedAt, но они могут быть очень близки.
    // Более надежный способ с findOneAndUpdate + upsert:true - это проверить, был ли документ до этого.
    const statusCode = existingProfile ? 200 : 201;
    const actionMessage = existingProfile ? 'updated' : 'created';

    console.log(`[PatientProfileController] Profile for user ${userId} ${actionMessage}.`);
    res.status(statusCode).json(updatedProfile);

  } catch (error: any) {
    console.error('[PatientProfileController] Error in upsertMyPatientProfileDetails:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ошибка уникальности (профиль для этого пользователя уже существует)' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера при создании/обновлении профиля пациента' });
    }
  }
};