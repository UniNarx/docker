import mongoose from 'mongoose';
import config from '../config';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('MongoDB подключена успешно!');

    mongoose.connection.on('error', (err) => {
      console.error(`Ошибка MongoDB после подключения: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB отключена.');
    });

  } catch (err: any) { // Используем any или unknown и затем проверяем тип
    console.error(`Ошибка подключения к MongoDB: ${err.message}`);
    // Завершаем процесс с ошибкой, если не удалось подключиться при старте
    process.exit(1);
  }
};

export default connectDB;