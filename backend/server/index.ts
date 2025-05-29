// backend/server/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http'; // Используем http для WebSocket

import appConfig from './config/index';
import connectDB from './utils/db';
import { seedRoles, seedSuperAdmin } from './utils/seed';

// Импорт сервисов и маршрутов
import { setupWebSocketServer } from './services/chatSocketService'; // WebSocket сервис
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import medicalRecordRoutes from './routes/medicalRecordRoutes';
import profileRoutes from './routes/profileRoutes';
import chatRoutes from './routes/chatRoutes'; // Маршруты для API чата

const app: Express = express();
const httpServer = http.createServer(app); // Создаем HTTP сервер для Express и WebSocket
const port = appConfig.port;

const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedSuperAdmin();

  console.log(`[server/index] Используется порт для Express: ${port}`);
  console.log(`[server/index] JWT Secret (первые 3 символа): ${appConfig.jwtSecret.substring(0, 3)}...`);
  console.log(`[server/index] MONGO_URI (начало): ${appConfig.mongoURI.split('/').slice(0,3).join('/')}/...`);

  app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Используйте переменную окружения
      credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
  });

  // Маршруты API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/medical-records', medicalRecordRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/chat', chatRoutes); // Добавляем маршруты API чата

  app.get('/hello', (req: Request, res: Response) => {
    res.json({ message: `Привет от отдельного Express сервера! Порт: ${port}` });
  });

  // Настройка WebSocket сервера, передаем ему httpServer
  setupWebSocketServer(httpServer);

  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[Express App] 404 - Route not found in Express: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(404).json({ message: 'Запрашиваемый ресурс не найден на API сервере' });
    }
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Express App] Глобальная ошибка Express:', err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Внутренняя ошибка сервера API', error: err.message });
    }
  });

  // Запускаем httpServer (который включает Express app)
  httpServer.listen(port, () => {
    console.log(`✅ Express API и WebSocket сервер запущены на http://localhost:${port}`);
  });

};

startServer().catch(error => {
  console.error("Критическая ошибка при запуске сервера:", error);
  process.exit(1);
});
