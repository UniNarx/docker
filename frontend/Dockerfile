# frontend/Dockerfile

# ---- Этап 1: Сборка приложения ----
FROM node:20-alpine AS builder
LABEL stage="nextjs-builder"
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем ВСЕ зависимости (включая devDependencies),
# так как NODE_ENV здесь еще не установлен в 'production'
RUN npm ci

# Копируем остальной код приложения
# Файлы, указанные в .dockerignore, не будут скопированы
COPY . .

# --- ОТЛАДОЧНЫЕ КОМАНДЫ (можно оставить для проверки или удалить) ---
RUN echo "Listing /app contents:" && ls -la /app
RUN echo "Listing /app/node_modules/@tailwindcss contents:" && ls -la /app/node_modules/@tailwindcss || echo "@tailwindcss not found"
RUN echo "Contents of postcss.config.mjs:" && cat /app/postcss.config.mjs
# --- КОНЕЦ ОТЛАДОЧНЫХ КОМАНД ---

# Устанавливаем NODE_ENV в production ПЕРЕД сборкой,
# чтобы Next.js сделал оптимизированную production-сборку
ENV NODE_ENV=production
RUN npm run build

# ---- Этап 2: Production-образ ----
FROM node:20-alpine AS runner
LABEL stage="nextjs-runner"
WORKDIR /app

ENV NODE_ENV=production
# ENV PORT=3000 # Можно установить здесь или при запуске контейнера

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Убедитесь, что имя файла next.config.ts (или .js) правильное
COPY --from=builder /app/next.config.ts ./next.config.ts 

EXPOSE 3000
CMD ["npm", "run", "start"]
