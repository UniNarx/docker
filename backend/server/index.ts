// server/index.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import appConfig from './config';
import connectDB from './utils/db';
import { seedRoles, seedSuperAdmin } from './utils/seed';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes'; // Убедитесь, что импорт на месте
import patientRoutes from './routes/patientRoutes';

const app: Express = express();
const port = appConfig.port;

// Middleware для логгирования каждого запроса, поступающего в Express
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Express App] Incoming request: ${req.method} ${req.originalUrl} (mapped to ${req.url})`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.get('/hello', (req: Request, res: Response) => {
  res.json({
    message: `Привет от Express сервера! Используется порт ${port} и JWT_SECRET: ${appConfig.jwtSecret.substring(0, 3)}...`,
    db_status: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use('/auth', authRoutes);     // Маршруты аутентификации
app.use('/users', userRoutes);    // Маршруты пользователя <--- ПЕРЕМЕЩЕНО СЮДА, ПЕРЕД 404
app.use('/patients', patientRoutes); 

// Обработчик для ненайденных маршрутов в Express (ставится ПОСЛЕ всех реальных роутов)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Express App] 404 - Route not found in Express: ${req.method} ${req.originalUrl} (mapped to ${req.url})`);
  if (!res.headersSent) {
    res.status(404).json({ message: 'Запрашиваемый ресурс не найден в Express' });
  }
});

// Глобальный обработчик ошибок Express (ставится в самом конце)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Express App] Глобальная ошибка Express:', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ message: 'Внутренняя ошибка сервера в Express', error: err.message });
  } else {
    console.error('[Express App] Headers already sent, cannot send error JSON from global Express error handler.');
  }
});

// ... (startServer и export default app остаются без изменений) ...
const startServer = async () => {
  await connectDB();
  await seedRoles();
  await seedSuperAdmin();

 console.log(`[server/index] Используется порт: ${port}`);
  console.log(`[server/index] JWT Secret (первые 3 символа): ${appConfig.jwtSecret.substring(0, 3)}...`);
  console.log(`[server/index] MONGO_URI (начало): ${appConfig.mongoURI.split('/').slice(0,3).join('/')}/...`);
};

startServer().catch(error => {
  console.error("Критическая ошибка при запуске сервера:", error);
  process.exit(1);
});

export default app;