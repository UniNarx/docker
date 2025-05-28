// pages/api/[...allroutes].ts
import { NextApiRequest, NextApiResponse } from 'next';
import server from '../../server/index'; // Убедитесь, что путь правильный

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const originalUrl = req.url;
  const method = req.method;
  console.log(`[Next API Handler] Received request: ${method} ${originalUrl}`); // LOG A

  if (!originalUrl) {
    console.error('[Next API Handler] Original URL is undefined!'); // LOG B
    // Важно: всегда отправляйте ответ, если выходите из функции раньше
    return res.status(500).send('Internal server error: URL undefined');
  }

  let targetUrl = originalUrl.startsWith('/api') ? originalUrl.replace(/^\/api/, '') : originalUrl;
  if (targetUrl === '' || targetUrl === '/') {
    targetUrl = '/'; 
  }
  
  console.log(`[Next API Handler] Mapped URL for Express: ${method} ${targetUrl}`); // LOG C (добавил метод для ясности)
  req.url = targetUrl; 

  try {
    console.log(`[Next API Handler] Attempting to call Express server for ${method} ${targetUrl}`); // LOG D
    return server(req, res); // Передаем запрос и ответ нашему Express-серверу
  } catch (error: any) { // Явно типизируем error
    console.error('[Next API Handler] Error invoking Express server:', error.message, error.stack); // LOG E
    if (!res.headersSent) {
        // Отправляем ответ, если Express не смог или произошла ошибка до него
        return res.status(500).send('Internal server error while invoking Express');
    } else {
        console.error('[Next API Handler] Headers already sent, cannot send error from Next API Handler catch block.');
    }
  }
}