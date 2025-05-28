// server/middleware/roleMiddleware.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => { // Явно указываем : void
    if (!req.user || !req.user.roleName) {
      console.warn('[RoleMiddleware] req.user или req.user.roleName не определены. Middleware protect должно быть вызвано первым.');
      res.status(401).json({ message: 'Не авторизован (данные пользователя отсутствуют)' });
      return; // Явный выход
    }

    if (allowedRoles.includes(req.user.roleName)) {
      next(); // Роль разрешена, передаем управление дальше
      // После next() функция может завершиться, и это будет void
    } else {
      console.log(`[RoleMiddleware] Доступ запрещен для роли "${req.user.roleName}". Разрешенные роли: ${allowedRoles.join(', ')}`);
      res.status(403).json({ message: 'Доступ запрещен (недостаточно прав)' });
      return; // Явный выход
    }
  };
};