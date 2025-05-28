// server/routes/userRoutes.ts
import { Router } from 'express';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware'; // <--- Импортируем authorize
import { Response } from 'express';

const router = Router();

console.log('[UserRoutes] Файл userRoutes.ts ЗАГРУЖЕН, роутер создан.');

// ... (логи ПЕРЕД/ПОСЛЕ определения маршрутов, если вы их оставили для отладки) ...

// GET /api/users/me - теперь требует роль 'Patient' (или выше, если бы мы так настроили)
router.get(
  '/me',
  protect, // Сначала проверяем аутентификацию
  authorize(['Patient', 'Doctor', 'Admin', 'SuperAdmin']), // Затем проверяем, что это одна из этих ролей
  (req: AuthenticatedRequest, res: Response) => {
    console.log('[UserRoutes] ВНУТРИ обработчика GET /me. User:', req.user);
    if (req.user) {
      res.status(200).json({
        message: 'Информация о текущем пользователе (требуется роль Patient или выше)',
        data: {
          id: req.user.id,
          username: req.user.username,
          roleId: req.user.roleId,
          roleName: req.user.roleName,
        }
      });
    } else {
      console.warn('[UserRoutes] ВНУТРИ GET /me, но req.user отсутствует после protect/authorize.');
      res.status(500).json({ message: 'Ошибка сервера: пользователь не был установлен middleware' });
    }
  }
);

// GET /api/users/admin-only - маршрут только для Admin или SuperAdmin
router.get(
  '/admin-only',
  protect,
  authorize(['Admin', 'SuperAdmin']), // Только для Admin и SuperAdmin
  (req: AuthenticatedRequest, res: Response) => {
    console.log('[UserRoutes] ВНУТРИ обработчика GET /admin-only. User:', req.user);
    res.status(200).json({
      message: 'Добро пожаловать в административную зону!',
      user: req.user,
    });
  }
);

router.get('/test', (req, res) => {
  console.log('[UserRoutes] ВНУТРИ обработчика GET /users/test');
  res.status(200).send('User routes test endpoint reached!');
});

export default router;