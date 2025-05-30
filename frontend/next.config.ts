// frontend/next.config.ts
const path = require('path');
import { Configuration as WebpackConfiguration } from 'webpack'; // Импорт типов Webpack
import { NextConfig } from 'next'; // Импорт типа NextConfig
const BACKEND_API_URL_FOR_REWRITES = process.env.BACKEND_API_URL_FOR_REWRITES || 'http://backend:8080/api';

// Определяем тип для опций, передаваемых в webpack функцию Next.js
interface NextWebpackOptions {
  buildId: string;
  dev: boolean;
  isServer: boolean;
  defaultLoaders: any;
  nextRuntime?: 'nodejs' | 'edge';
  webpack: any; // Тип для самого инстанса webpack
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080',
  },
  images: {
    domains: ['utfs.io', 'localhost'],
  },
  async rewrites() {
   return [
      {
        source: '/api/:path*',
        // Используем переменную окружения для destination
        destination: `${BACKEND_API_URL_FOR_REWRITES}/:path*`,
      },
    ]
  },
  webpack: (
    config: WebpackConfiguration,
    options: NextWebpackOptions
  ): WebpackConfiguration => {    
    
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // Убедимся, что config.resolve.alias является объектной картой.
    // Если это undefined, null, false или массив, мы инициализируем его как пустой объект,
    // так как мы намерены добавлять алиасы в формате ключ-значение.
    if (
      typeof config.resolve.alias !== 'object' || 
      config.resolve.alias === null || 
      Array.isArray(config.resolve.alias)
    ) {
      config.resolve.alias = {};
    }

    // Теперь мы уверены, что config.resolve.alias - это объект.
    // Используем приведение типа (type assertion) для безопасного присваивания.
    // Тип значения для alias может быть string, string[] или false.
    const alias = config.resolve.alias as { [key: string]: string | string[] | false };
    alias['@'] = path.join(__dirname, 'src');
    
    // Пример для более конкретных алиасов, если нужно:
    // alias['@/components'] = path.join(__dirname, 'src/components');
    // alias['@/lib'] = path.join(__dirname, 'src/lib');
    
    return config;
  },
};

module.exports = nextConfig;
