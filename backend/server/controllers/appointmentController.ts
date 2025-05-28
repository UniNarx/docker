// server/controllers/appointmentController.ts
import { Request, Response } from 'express';
import Appointment, { IAppointment, AppointmentStatus } from '../models/Appointment';
import Doctor, { IDoctor } from '../models/Doctor';
import Patient, { IPatient } from '../models/Patient';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isValidObjectId } from 'mongoose';


// @desc    Создать новую запись на прием
// @route   POST /api/appointments
// @access  Private (Patient может создавать для себя, Admin/SuperAdmin могут создавать для других)
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AppointmentController] createAppointment hit. User role:', req.user?.roleName);
  try {
    const { doctorId, patientId, apptTime } = req.body; // patientId может быть опциональным, если пациент создает для себя
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;

    if (!doctorId || !apptTime) {
      res.status(400).json({ message: 'ID врача и время приема обязательны' });
      return;
    }

    if (!isValidObjectId(doctorId)) {
        res.status(400).json({ message: 'Некорректный ID врача' });
        return;
    }

    const appointmentTime = new Date(apptTime);
    if (isNaN(appointmentTime.getTime())) {
        res.status(400).json({ message: 'Некорректный формат времени приема' });
        return;
    }

    // Проверяем, существует ли врач
    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    let finalPatientId = patientId;

    // Если пациент создает для себя и не передает patientId
    if (requestingUserRole === 'Patient' && !patientId) {
      const patientProfile = await Patient.findOne({ user: requestingUserId });
      if (!patientProfile) {
        res.status(404).json({ message: 'Профиль пациента для текущего пользователя не найден. Пожалуйста, создайте его.' });
        return;
      }
      finalPatientId = patientProfile._id.toString();
    } else if (['Admin', 'SuperAdmin'].includes(requestingUserRole!) && patientId) {
        // Админ может указать patientId
        if (!isValidObjectId(patientId)) {
            res.status(400).json({ message: 'Некорректный ID пациента' });
            return;
        }
        const patientExists = await Patient.findById(patientId);
        if(!patientExists){
            res.status(404).json({ message: `Пациент с ID ${patientId} не найден` });
            return;
        }
        finalPatientId = patientId;
    } else if (requestingUserRole === 'Patient' && patientId) {
        // Пациент пытается создать запись для другого пациента - запрещено
        const patientProfile = await Patient.findOne({ user: requestingUserId });
        if (!patientProfile || patientProfile._id.toString() !== patientId) {
            res.status(403).json({ message: 'Пациенты могут создавать записи только для себя.' });
            return;
        }
        finalPatientId = patientId; // он же и есть patientProfile._id
    } else {
        res.status(400).json({ message: 'ID пациента не указан или недостаточно прав для указания ID пациента' });
        return;
    }
    
    // Проверка на конфликт времени у врача (простая)
    // В реальном приложении здесь должна быть более сложная логика проверки доступности слотов
    const existingAppointmentForDoctor = await Appointment.findOne({
        doctor: doctorId,
        apptTime: appointmentTime,
        status: { $ne: AppointmentStatus.CANCELLED } // Не считаем отмененные
    });

    if (existingAppointmentForDoctor) {
        res.status(409).json({ message: 'Выбранное время у данного врача уже занято' });
        return;
    }

    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: finalPatientId,
      apptTime: appointmentTime,
      // status по умолчанию 'scheduled' из модели
    });

    console.log(`[AppointmentController] Appointment created with ID: ${appointment._id}`);
    res.status(201).json(appointment);

  } catch (error: any) {
    console.error('[AppointmentController] Ошибка в createAppointment:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании записи на прием' });
  }
};

// @desc    Получить записи на прием для конкретного пациента
// @route   GET /api/patients/:patientId/appointments (для админа/врача)
// @route   GET /api/appointments/my (для залогиненного пациента)
// @access  Private
export const getPatientAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;
    let patientProfileIdForQuery: string | undefined;

    if (req.params.patientId) { // Если ID пациента указан в URL (например, /api/patients/:patientId/appointments)
        if (!['Admin', 'SuperAdmin', 'Doctor'].includes(requestingUserRole!)) {
            // Только админ, суперадмин или врач (если это его пациент) могут смотреть чужие записи
            // Логику для "его пациент" нужно будет добавить позже, если это врач
            res.status(403).json({ message: 'Недостаточно прав для просмотра записей этого пациента' });
            return;
        }
        if (!isValidObjectId(req.params.patientId)) {
            res.status(400).json({ message: 'Некорректный ID пациента в URL' });
            return;
        }
        patientProfileIdForQuery = req.params.patientId;
    } else { // Подразумевается маршрут /api/appointments/my (для текущего пациента)
        if (requestingUserRole !== 'Patient') {
            res.status(400).json({ message: 'Этот маршрут предназначен только для пациентов для просмотра своих записей.'});
            return;
        }
        const patientProfile = await Patient.findOne({ user: requestingUserId });
        if (!patientProfile) {
            res.status(404).json({ message: 'Профиль пациента для текущего пользователя не найден.' });
            return;
        }
        patientProfileIdForQuery = patientProfile._id.toString();
    }
    
    console.log(`[AppointmentController] getPatientAppointments for patient profile ID: ${patientProfileIdForQuery}`);

    const appointments = await Appointment.find({ patient: patientProfileIdForQuery })
      .populate('doctor', 'firstName lastName specialty') // Данные врача
      .populate('patient', 'firstName lastName') // Данные пациента (может быть избыточно, если и так по ID пациента ищем)
      .sort({ apptTime: 'asc' }); // Сортируем по времени приема

    res.status(200).json(appointments);

  } catch (error: any) {
    console.error('[AppointmentController] Ошибка в getPatientAppointments:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении записей пациента' });
  }
};


// @desc    Отменить запись на прием
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Пациент свою, Admin/SuperAdmin любую)
export const getDoctorAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;
    let doctorProfileIdForQuery: string | undefined;

    if (req.params.doctorId) { // Если ID врача указан в URL (например, /api/doctors/:doctorId/appointments)
      if (!['Admin', 'SuperAdmin', 'Doctor'].includes(requestingUserRole!)) {
        // Только админ, суперадмин или сам врач могут смотреть расписание
        res.status(403).json({ message: 'Недостаточно прав для просмотра записей этого врача' });
        return;
      }
      if (!isValidObjectId(req.params.doctorId)) {
        res.status(400).json({ message: 'Некорректный ID врача в URL' });
        return;
      }
      // Если это врач, и он запрашивает расписание другого врача (не себя) - это может быть ограничено
      // Пока что разрешим админам/суперадминам смотреть любого, а врачу - любого (можно доработать).
      doctorProfileIdForQuery = req.params.doctorId;

    } else { // Подразумевается маршрут /api/appointments/doctor/me (для текущего врача)
      if (requestingUserRole !== 'Doctor') {
        res.status(400).json({ message: 'Этот маршрут предназначен только для врачей для просмотра своего расписания.' });
        return;
      }
      const doctorProfile = await Doctor.findOne({ user: requestingUserId });
      if (!doctorProfile) {
        res.status(404).json({ message: 'Профиль врача для текущего пользователя не найден. Зарегистрируйтесь как врач.' });
        return;
      }
      doctorProfileIdForQuery = doctorProfile._id.toString();
    }

    console.log(`[AppointmentController] getDoctorAppointments for doctor profile ID: ${doctorProfileIdForQuery}`);

    const appointments = await Appointment.find({ doctor: doctorProfileIdForQuery })
      .populate('patient', 'firstName lastName') // Данные пациента
      .populate('doctor', 'firstName lastName specialty') // Данные врача (может быть избыточно, если и так по ID врача ищем)
      .sort({ apptTime: 'asc' }); // Сортируем по времени приема

    res.status(200).json(appointments);

  } catch (error: any) {
    console.error('[AppointmentController] Ошибка в getDoctorAppointments:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении записей врача' });
  }
};

export const cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const appointmentId = req.params.id;
  console.log(`[AppointmentController] cancelAppointment hit. Appointment ID: ${appointmentId}, User ID: ${req.user?.id}, Role: ${req.user?.roleName}`);

  if (!isValidObjectId(appointmentId)) {
    res.status(400).json({ message: 'Некорректный ID записи' });
    return;
  }

  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient');

    if (!appointment) {
      res.status(404).json({ message: 'Запись на прием не найдена' });
      return;
    }

    // Проверка прав на отмену
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;
    // (appointment.patient as IPatient) может быть null, если populate не сработал как надо, или ID пациента невалидный в записи
    // Но если запись найдена, то patient ID там должен быть.
    // Для доступа к user ID пациента, нужно чтобы поле patient было объектом IPatient (после populate)
    // и у IPatient было поле user типа Types.ObjectId | IUser
    
    let canCancel = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUserRole!)) {
      canCancel = true;
    } else if (requestingUserRole === 'Patient') {
      // Пациент может отменить только свою запись
      // (appointment.patient as IPatient).user должен быть ID пользователя текущего пациента
      // Для этого нужно, чтобы при создании IPatient мы также сохраняли user ID, или чтобы populate вернул user.
      // Проще сравнить ID профиля пациента из токена с ID профиля пациента в записи
      const currentPatientProfile = await Patient.findOne({ user: requestingUserId });
      if (currentPatientProfile && currentPatientProfile._id.equals(appointment.patient._id)) {
          canCancel = true;
      }
    }
    // TODO: Врач также может отменять свои записи или записи своих пациентов

    if (!canCancel) {
      res.status(403).json({ message: 'Недостаточно прав для отмены этой записи' });
      return;
    }

    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.COMPLETED) {
      res.status(400).json({ message: `Запись уже ${appointment.status === AppointmentStatus.COMPLETED ? 'завершена' : 'отменена'} и не может быть отменена снова.` });
      return;
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    console.log(`[AppointmentController] Appointment ID: ${appointmentId} cancelled by user ID: ${requestingUserId}`);
    res.status(200).json(appointment);

  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в cancelAppointment (ID: ${appointmentId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при отмене записи на прием' });
  }
};

export const getAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const appointmentId = req.params.id;
  console.log(`[AppointmentController] getAppointmentById hit. Appointment ID: ${appointmentId}`);

  if (!isValidObjectId(appointmentId)) {
    res.status(400).json({ message: 'Некорректный ID записи' });
    return;
  }

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctor', 'firstName lastName specialty user') // Добавим user ID врача
      .populate('patient', 'firstName lastName user');  // Добавим user ID пациента

    if (!appointment) {
      res.status(404).json({ message: 'Запись на прием не найдена' });
      return;
    }

    // Проверка прав доступа:
    // Пациент может видеть свою запись, врач - свою, админы - любую.
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;

    let canView = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUserRole!)) {
      canView = true;
    } else if (requestingUserRole === 'Patient') {
      // ID пользователя текущего пациента должен совпадать с ID пользователя в записи пациента
      const patientProfile = await Patient.findOne({ user: requestingUserId });
      if (patientProfile && patientProfile._id.equals((appointment.patient as IPatient)._id)) {
        canView = true;
      }
    } else if (requestingUserRole === 'Doctor') {
      // ID пользователя текущего врача должен совпадать с ID пользователя в записи врача
      const doctorProfile = await Doctor.findOne({ user: requestingUserId });
      if (doctorProfile && doctorProfile._id.equals((appointment.doctor as IDoctor)._id)) {
        canView = true;
      }
    }

    if (!canView) {
      res.status(403).json({ message: 'Недостаточно прав для просмотра этой записи' });
      return;
    }

    res.status(200).json(appointment);

  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в getAppointmentById (ID: ${appointmentId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении записи на прием' });
  }
};

// @desc    Обновить статус записи на прием
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor, Admin, SuperAdmin)
export const updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const appointmentId = req.params.id;
  const { status } = req.body; // Ожидаем новый статус в теле запроса
  console.log(`[AppointmentController] updateAppointmentStatus hit. AppID: ${appointmentId}, NewStatus: ${status}, User: ${req.user?.username}`);

  if (!isValidObjectId(appointmentId)) {
    res.status(400).json({ message: 'Некорректный ID записи' });
    return;
  }

  // Проверяем, что переданный статус валиден
  if (!status || !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    res.status(400).json({ message: `Некорректный статус. Допустимые значения: ${Object.values(AppointmentStatus).join(', ')}` });
    return;
  }

  try {
    const appointment = await Appointment.findById(appointmentId).populate('doctor'); // Популируем доктора для проверки прав

    if (!appointment) {
      res.status(404).json({ message: 'Запись на прием не найдена' });
      return;
    }

    // Проверка прав на изменение статуса
    // Обычно только врач, к которому запись, или администраторы могут менять статус
    const requestingUserId = req.user?.id;
    const requestingUserRole = req.user?.roleName;

    let canUpdateStatus = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUserRole!)) {
      canUpdateStatus = true;
    } else if (requestingUserRole === 'Doctor') {
      // Врач может изменить статус только своей записи
      const doctorProfile = await Doctor.findOne({ user: requestingUserId });
      if (doctorProfile && doctorProfile._id.equals((appointment.doctor as IDoctor)._id)) {
        canUpdateStatus = true;
      }
    }

    if (!canUpdateStatus) {
      res.status(403).json({ message: 'Недостаточно прав для изменения статуса этой записи' });
      return;
    }

    // Нельзя изменить статус отмененной записи (кроме как админом на "scheduled"?) - пока упростим
    if (appointment.status === AppointmentStatus.CANCELLED && status !== AppointmentStatus.SCHEDULED && !['Admin', 'SuperAdmin'].includes(requestingUserRole!)) {
        res.status(400).json({ message: 'Отмененную запись нельзя изменить (кроме восстановления администратором).' });
        return;
    }
    // Нельзя отменить уже завершенную запись
    if (appointment.status === AppointmentStatus.COMPLETED && status === AppointmentStatus.CANCELLED) {
        res.status(400).json({ message: 'Завершенную запись нельзя отменить.' });
        return;
    }


    appointment.status = status as AppointmentStatus;
    const updatedAppointment = await appointment.save();

    console.log(`[AppointmentController] Appointment ID: ${appointmentId} status updated to ${status} by user ID: ${requestingUserId}`);
    res.status(200).json(updatedAppointment);

  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в updateAppointmentStatus (ID: ${appointmentId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении статуса записи' });
  }
};

export const getDoctorAvailability = async (req: Request, res: Response): Promise<void> => {
  const { doctorId } = req.params;
  const { date } = req.query; // date будет строкой 'YYYY-MM-DD'

  console.log(`[AppointmentController] getDoctorAvailability hit. DoctorID: ${doctorId}, Date: ${date}`);

  if (!doctorId || !date) {
    res.status(400).json({ message: 'ID врача и дата обязательны' });
    return;
  }

  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID врача' });
    return;
  }

  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ message: 'Некорректный формат даты. Используйте ГГГГ-ММ-ДД.' });
    return;
  }

  try {
    // Проверяем, существует ли врач
    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    // Параметры рабочего дня и длительности приема (пока константы)
    const workDayStartHour = 9; // 9:00
    const workDayEndHour = 17;   // до 17:00 (последний слот начнется в 16:00, если прием час)
    const appointmentDurationMinutes = 60; // Длительность приема в минутах

    const requestedDate = new Date(date as string); // Преобразуем строку даты в объект Date
    // Устанавливаем время на начало дня по UTC, чтобы избежать проблем с часовыми поясами при сравнении только дат
    requestedDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(requestedDate);
    nextDay.setUTCDate(requestedDate.getUTCDate() + 1);

    // Находим все существующие (не отмененные) записи для этого врача на указанную дату
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      apptTime: {
        $gte: requestedDate, // Больше или равно началу указанного дня (00:00:00 UTC)
        $lt: nextDay,        // Меньше начала следующего дня (00:00:00 UTC)
      },
      status: { $ne: AppointmentStatus.CANCELLED },
    }).select('apptTime'); // Нам нужны только времена записей

    const bookedSlots = new Set(
      existingAppointments.map(appt => {
        const apptDate = new Date(appt.apptTime);
        // Форматируем время в HH:MM (по UTC, так как мы все даты привели к UTC)
        // Для локального времени нужно будет использовать методы getHours(), getMinutes()
        // или библиотеку для работы с датами, если важны часовые пояса сервера/клиента.
        // Пока для простоты будем считать, что все время в UTC или локальном времени сервера.
        // На клиенте нужно будет также учитывать часовой пояс пользователя.
        return `${String(apptDate.getUTCHours()).padStart(2, '0')}:${String(apptDate.getUTCMinutes()).padStart(2, '0')}`;
      })
    );
    
    console.log(`[AppointmentController] Занятые слоты для ${date}:`, Array.from(bookedSlots));

    const availableSlots: string[] = [];
    const currentDate = new Date(date as string); // Берем дату без времени для начала генерации слотов

    for (let hour = workDayStartHour; hour < workDayEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += appointmentDurationMinutes) {
        const slotTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        // Формируем полное время слота для сравнения с текущим временем
        // Важно: этот new Date() будет в локальном времени сервера.
        // Если apptTime хранится в UTC, то и это время нужно формировать в UTC.
        // Для простоты этого примера, предположим, что клиент и сервер работают в одном понимании "дня"
        // и передают/хранят время так, что сравнение HH:MM будет корректным.
        // Либо, при создании записи, apptTime должно быть установлено в UTC на начало часа.

        // Проверяем, не занят ли слот и не прошел ли он уже (для текущего дня)
        const slotDateTime = new Date(currentDate);
        slotDateTime.setHours(hour, minute, 0, 0); // Устанавливаем часы и минуты в локальном времени сервера

        const now = new Date();
        
        // Простая проверка: если дата слота сегодня и время слота уже прошло - не добавляем
        // Также, если дата слота в прошлом - не добавляем
        if (slotDateTime < now && slotDateTime.toDateString() === now.toDateString()) {
            // console.log(`[AppointmentController] Слот ${slotTime} на сегодня уже прошел.`);
            continue;
        }
        if (slotDateTime < new Date(new Date().toDateString())) { // Сравниваем только даты
            // console.log(`[AppointmentController] Дата ${date} уже прошла.`);
            // Эту проверку лучше делать в начале функции для всей даты.
            // Если дата в прошлом, можно сразу вернуть пустой массив.
        }


        if (!bookedSlots.has(slotTime)) {
          availableSlots.push(slotTime);
        }
      }
    }

    // Если запрашиваемая дата уже прошла, возвращаем пустой массив
    const todayWithoutTime = new Date();
    todayWithoutTime.setHours(0,0,0,0);
    if (requestedDate < todayWithoutTime) {
        console.log(`[AppointmentController] Запрашиваемая дата ${date} уже в прошлом.`);
        res.status(200).json([]);
        return;
    }


    console.log(`[AppointmentController] Доступные слоты для ${date}:`, availableSlots);
    res.status(200).json(availableSlots);

  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в getDoctorAvailability (DoctorID: ${doctorId}, Date: ${date}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении доступных слотов времени' });
  }
};