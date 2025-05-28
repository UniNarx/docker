// server/utils/seed.ts
import Role, { IRole } from '../models/Role';
import User, { IUser } from '../models/User'; // Импортируем User и IUser
import bcrypt from 'bcryptjs';
import appConfig from '../config'; // Если вы захотите брать данные из конфига

const ROLES = ['Patient', 'Doctor', 'Admin', 'SuperAdmin'];

export const seedRoles = async () => {
  // ... (существующий код для создания ролей) ...
  // Убедитесь, что он завершается, если роли уже есть
  try {
    const count = await Role.estimatedDocumentCount();
    if (count === ROLES.length) { // Проверяем, что все ожидаемые роли уже есть
         // console.log('Все роли по умолчанию уже существуют в базе данных.');
        return;
    }
    if (count > 0 && count < ROLES.length) {
        console.warn('Часть ролей существует, но не все. Проверьте консистентность ролей.');
        // Можно добавить логику для создания только недостающих ролей
    }
    if (count === 0) {
        console.log('Роли не найдены. Создание ролей по умолчанию...');
        const rolesToCreate: Partial<IRole>[] = ROLES.map(name => ({ name }));
        await Role.insertMany(rolesToCreate);
        console.log('Роли по умолчанию успешно созданы:', ROLES.join(', '));
    }

  } catch (error) {
    console.error('Ошибка при создании ролей по умолчанию:', error);
  }
};

export const seedSuperAdmin = async () => {
  try {
    // Проверяем, существует ли уже пользователь с ролью SuperAdmin или с определенным username
    const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
    if (!superAdminRole) {
      console.error('Роль SuperAdmin не найдена. Сначала должны быть созданы роли.');
      return;
    }

    const existingSuperAdmin = await User.findOne({ role: superAdminRole._id });
    // Или можно искать по конкретному username:
    // const existingSuperAdmin = await User.findOne({ username: 'superadmin' });


    if (existingSuperAdmin) {
      // console.log('SuperAdmin уже существует.');
      return;
    }

    console.log('SuperAdmin не найден. Создание SuperAdmin...');

    const salt = await bcrypt.genSalt(10);
    // Используйте надежный пароль и имя пользователя из переменных окружения или конфига
    // НЕ ХРАНИТЕ ПАРОЛИ В КОДЕ!
    const superAdminUsername = process.env.SUPERADMIN_USERNAME || 'superadmin';
    const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'supersecretpassword';

    if (superAdminPassword === 'supersecretpassword') {
        console.warn("Используется пароль SuperAdmin по умолчанию. Измените его через переменные окружения SUPERADMIN_PASSWORD!");
    }

    const passwordHash = await bcrypt.hash(superAdminPassword, salt);

    const newSuperAdmin = new User({
      username: superAdminUsername,
      passwordHash,
      role: superAdminRole._id,
    });

    await newSuperAdmin.save();
    console.log(`SuperAdmin "${superAdminUsername}" успешно создан.`);

  } catch (error) {
    console.error('Ошибка при создании SuperAdmin:', error);
  }
};