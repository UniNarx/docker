// server/config/index.ts
// import dotenv from 'dotenv'; // Не нужно
// import path from 'path'; // Не нужно

// Никаких явных dotenv.config() здесь

// Логгируем, что видит process.env на момент инициализации этого модуля
console.log(`[config] process.env.PORT при инициализации модуля config: ${process.env.PORT}`);
console.log(`[config] process.env.JWT_SECRET при инициализации модуля config (первые 3): ${process.env.JWT_SECRET?.substring(0,3)}...`);
console.log(`[config] process.env.MONGODB_URI при инициализации модуля config (начало): ${process.env.MONGODB_URI?.split('/').slice(0,3).join('/')}/...`);


interface AppConfig {
  port: string;
  mongoURI: string;
  jwtSecret: string;
  // Добавим переменную для определения, работаем ли мы в окружении Next.js
  isNextDev: boolean;
}

const config: AppConfig = {
  // Для порта, если мы в Next.js, он будет установлен Next.js.
  // Если нет (например, отдельный запуск Express), возьмем из process.env или дефолт.
  port: process.env.PORT || '3001',
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/default_clinic_db',
  jwtSecret: process.env.JWT_SECRET || 'default_secret_key_please_change',
  isNextDev: !!process.env.NEXT_RUNTIME, // Простой способ проверить, запущено ли в среде Next.js
};

console.log(`[config] Итоговые значения в объекте config: PORT=<span class="math-inline">\{config\.port\}, JWT\_SECRET\=</span>{config.jwtSecret.substring(0,3)}..., isNextDev=${config.isNextDev}`);

if (!config.mongoURI || config.jwtSecret === 'default_secret_key_please_change') {
  console.warn('[config] ПРЕДУПРЕЖДЕНИЕ: MONGODB_URI не установлен или JWT_SECRET использует значение по умолчанию!');
}

export default config;