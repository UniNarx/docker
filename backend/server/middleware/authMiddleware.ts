// server/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // JwtPayload уже импортируется здесь
import { Types } from 'mongoose'; // Импортируем Types
import appConfig from '../config';
import User, { IUser } from '../models/User';
import Role, { IRole } from '../models/Role';
import { JwtPayloadWithIds } from '../types/jwt'; // Наш кастомный тип

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string;
    roleName?: string;
  };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => { // Явно укажем Promise<void>
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Не авторизован: отсутствует заголовок Authorization или неверный формат' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      appConfig.jwtSecret
    ) as JwtPayloadWithIds; // Используем наш кастомный тип

    // Проверяем, что decoded.userId и decoded.roleId существуют после приведения типа
    // (хотя JwtPayloadWithIds уже должен это гарантировать)
    if (!decoded.userId || !decoded.roleId) {
        console.warn('[AuthMiddleware] Токен не содержит userId или roleId после декодирования');
        res.status(401).json({ message: 'Не авторизован, неполные данные в токене' });
        return;
    }

    // Используем .lean() для получения POJO (Plain Old JavaScript Object)
    // и дженерик для указания TypeScript ожидаемого типа объекта.
    // IUser и IRole теперь имеют _id: Types.ObjectId
    const userFromDb = await User.findById(decoded.userId)
      .select('-passwordHash')
      .lean<IUser>(); // Ожидаем объект, соответствующий IUser

    const roleFromDb = await Role.findById(decoded.roleId)
      .lean<IRole>(); // Ожидаем объект, соответствующий IRole

    if (!userFromDb || !roleFromDb) {
      console.warn(`[AuthMiddleware] Пользователь ${decoded.userId} или его роль ${decoded.roleId} не найдены в БД (после lean).`);
      res.status(401).json({ message: 'Не авторизован, пользователь или роль не найдены' });
      return;
    }

    // Теперь userFromDb._id и roleFromDb._id должны быть типа Types.ObjectId
    // благодаря IUser/IRole и .lean<Тип>()
    req.user = {
      id: userFromDb._id.toString(),       // .toString() на ObjectId вернет строку
      username: userFromDb.username,
      roleId: roleFromDb._id.toString(),   // .toString() на ObjectId вернет строку
      roleName: roleFromDb.name,
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Ошибка обработки токена:', err);
    // Проверяем тип ошибки для более конкретного сообщения
    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Не авторизован: недействительный токен' });
    } else if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Не авторизован: срок действия токена истек' });
    } else {
        res.status(401).json({ message: 'Не авторизован: ошибка токена' });
    }
    return;
  }
};