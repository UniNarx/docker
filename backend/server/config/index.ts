// backend/server/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// process.cwd() при запуске "npm run dev" из папки "backend" будет "/path/to/backend"
// Таким образом, envPath будет указывать на "/path/to/backend/.env"
const envPath = path.resolve(process.cwd(), '.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.warn(`[config] Ошибка загрузки .env файла из ${envPath}: ${dotenvResult.error.message}`);
  console.warn(`[config] Убедитесь, что .env файл существует в ${process.cwd()} и содержит необходимые переменные.`);
} else {
  if (dotenvResult.parsed) {
    console.log(`[config] .env файл из ${envPath} успешно загружен. Загруженные переменные:`, Object.keys(dotenvResult.parsed));
  } else {
    console.log(`[config] .env файл из ${envPath} загружен, но не содержит переменных (или пуст).`);
  }
}

// Логгируем, что видит process.env СРАЗУ ПОСЛЕ попытки загрузки dotenv
console.log(`[config] process.env.PORT после dotenv: ${process.env.PORT}`);
console.log(`[config] process.env.JWT_SECRET после dotenv (первые 3): ${process.env.JWT_SECRET?.substring(0,3)}...`);
console.log(`[config] process.env.MONGODB_URI после dotenv (начало): ${process.env.MONGODB_URI?.split('/').slice(0,3).join('/')}/...`);

interface AppConfig {
  port: string;
  mongoURI: string;
  jwtSecret: string;
  // isNextDev больше не актуален для отдельного Express сервера
}

const config: AppConfig = {
  port: process.env.PORT || '8080', // Дефолтный порт для бэкенда, если не указан в .env
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/default_clinic_db',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key_please_change_in_env',
};

console.log(`[config] Итоговые значения в объекте config: PORT=${config.port}, JWT_SECRET=${config.jwtSecret.substring(0,3)}...`);

if (!config.mongoURI || config.jwtSecret === 'default_secret_key_please_change_in_env' || !process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.warn('[config] ПРЕДУПРЕЖДЕНИЕ: MONGODB_URI или JWT_SECRET не установлены из .env файла или используют значение по умолчанию!');
}

export default config;