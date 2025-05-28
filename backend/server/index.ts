// server/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import appConfig from './config/index';
import connectDB from './utils/db';
import { seedRoles, seedSuperAdmin } from './utils/seed';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes'; // Убедитесь, что импорт на месте
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import appointmentRoutes from './routes/appointmentRoutes'; 
import medicalRecordRoutes from './routes/medicalRecordRoutes';
import profileRoutes from './routes/profileRoutes';

const app: Express = express();
const port = appConfig.port;

const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedSuperAdmin();

  console.log(`[server/index] Используется порт для Express: ${port}`); // port из appConfig
  console.log(`[server/index] JWT Secret (первые 3 символа): ${appConfig.jwtSecret.substring(0, 3)}...`);
  console.log(`[server/index] MONGO_URI (начало): ${appConfig.mongoURI.split('/').slice(0,3).join('/')}/...`);

  // Middleware (CORS, json, urlencoded, логгер)
  app.use(cors({ // Настройте CORS более точно для вашего фронтенда в продакшене
      origin: 'http://localhost:3000', // Укажите порт вашего фронтенда (например, 3000, если фронт на нем)
      credentials: true, // Если нужны куки или Authorization заголовки
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] Incoming request: ${req.method} ${req.originalUrl}`); // req.url здесь будет полный
    next();
  });

  // Маршруты (теперь они будут напрямую от корня, а не от /api из-за Next.js)
  // Если вы хотите сохранить префикс /api для всех ваших API маршрутов:
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medical-records', medicalRecordRoutes); 
  app.use('/api/profiles', profileRoutes);
  // ... другие группы маршрутов с префиксом /api ...

  // Тестовый маршрут (теперь http://localhost:ВАШ_БЭКЕНД_ПОРТ/hello)
  app.get('/hello', (req: Request, res: Response) => {
    res.json({ message: `Привет от отдельного Express сервера! Порт: ${port}` });
  });


  // Обработчик для ненайденных маршрутов в Express
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] 404 - Route not found in Express: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(404).json({ message: 'Запрашиваемый ресурс не найден на API сервере' });
    }
  });

  // Глобальный обработчик ошибок Express
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Express App] Глобальная ошибка Express:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Внутренняя ошибка сервера API', error: err.message });
    }
  });

  // Запускаем сервер Express, чтобы он слушал порт
  app.listen(port, () => {
    console.log(`✅ Express API сервер запущен на http://localhost:${port}`);
  });

};

startServer().catch(error => {
  console.error("Критическая ошибка при запуске Express API сервера:", error);
  process.exit(1);
});