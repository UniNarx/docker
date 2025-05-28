// backend/server/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, registerAdmin } from '../controllers/authController'; // Добавляем registerAdmin
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Новый маршрут для создания пользователя с указанной ролью (только для SuperAdmin)
router.post('/register-admin', protect, authorize(['SuperAdmin']), registerAdmin);

export default router;