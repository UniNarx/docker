// server/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Role, { IRole } from '../models/Role';
import appConfig from '../config'; // Убедитесь, что импортирован, если нужен (для login)
import jwt from 'jsonwebtoken';    // Убедитесь, что импортирован, если нужен (для login)
import { JwtPayloadWithIds } from '../types/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  console.log('[Register API] Entered register function'); // Лог 1
  try {
    const { username, password } = req.body;
    console.log(`[Register API] Received username: ${username}, password: ${password ? '***' : 'undefined'}`); // Лог 2

    if (!username || !password) {
      console.log('[Register API] Validation failed: username or password missing'); // Лог 3
      res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });
      return;
    }

    console.log(`[Register API] Looking for existing user: ${username}`); // Лог 4
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.log(`[Register API] User ${username} already exists.`); // Лог 5
      res.status(400).json({ message: 'Имя пользователя уже занято' });
      return;
    }

    console.log(`[Register API] User ${username} not found, proceeding with registration.`); // Лог 6
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log(`[Register API] Password hashed for ${username}.`); // Лог 7

    console.log('[Register API] Looking for "Patient" role.'); // Лог 8
    const patientRole = await Role.findOne({ name: 'Patient' });

    if (!patientRole) {
      console.error('[Register API] CRITICAL: "Patient" role not found!'); // Лог 9
      res.status(500).json({ message: 'Ошибка сервера: роль по умолчанию не найдена' });
      return;
    }
    console.log(`[Register API] "Patient" role found with ID: ${patientRole._id}`); // Лог 10

    const newUser = new User({
      username,
      passwordHash,
      role: patientRole._id,
    });

    console.log(`[Register API] Saving new user: ${username}`); // Лог 11
    await newUser.save();
    console.log(`[Register API] User ${username} saved successfully with ID: ${newUser._id}`); // Лог 12

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: newUser._id,
      username: newUser.username,
    });
    console.log(`[Register API] Sent 201 response for ${username}.`); // Лог 13
    return;

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

    if (!user.role) {
        console.error(`[Login API] CRITICAL: Role for user ${user.username} not found after populate.`);
        res.status(500).json({ message: 'Ошибка сервера: не удалось определить роль пользователя' });
        return;
    }
    console.log(`[Login API] Role for user ${user.username} is ${(user.role as any).name}.`);
    
    const payload: JwtPayloadWithIds = { // Используем наш новый тип
    userId: user._id.toString(),      // Конвертируем в строку
    username: user.username,
    roleId: (user.role as IRole)._id.toString(), // Конвертируем в строку
};

const token = jwt.sign(
    payload,
    appConfig.jwtSecret,
    { expiresIn: '24h' }
);
    console.log(`[Login API] JWT generated for user ${username}.`);

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: (user.role as any).name
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