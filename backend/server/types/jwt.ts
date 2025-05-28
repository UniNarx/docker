// server/types/jwt.ts
import { JwtPayload } from 'jsonwebtoken'; // Базовый интерфейс из библиотеки jsonwebtoken

export interface JwtPayloadWithIds extends JwtPayload {
  userId: string; // Или Types.ObjectId, если вы храните ObjectId в токене
  roleId: string; // Или Types.ObjectId
  username?: string; // Добавим username, так как мы его кладем в токен
}