// server/controllers/appointmentController.ts
import { Request, Response } from 'express';
import Appointment, { IAppointment, AppointmentStatus } from '../models/Appointment';
import Doctor, { IDoctor } from '../models/Doctor';
import Patient, { IPatient } from '../models/Patient';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import mongoose, { isValidObjectId, Types } from 'mongoose'; // Добавили Types


// @desc    Создать новую запись на прием
// @route   POST /api/appointments
// @access  Private (Patient может создавать для себя, Admin/SuperAdmin могут создавать для других)
export const createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AppointmentController] createAppointment hit. User role:', req.user?.roleName);
  try {
    const { doctorId, patientId, apptTime } = req.body; // Ожидаем camelCase
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

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    let finalPatientId = patientId;

    if (requestingUserRole === 'Patient' && !patientId) {
      const patientProfile = await Patient.findOne({ user: requestingUserId });
      if (!patientProfile) {
        res.status(404).json({ message: 'Профиль пациента для текущего пользователя не найден.' });
        return;
      }
      finalPatientId = patientProfile._id.toString();
    } else if (['Admin', 'SuperAdmin'].includes(requestingUserRole!) && patientId) {
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
        const patientProfile = await Patient.findOne({ user: requestingUserId });
        if (!patientProfile || patientProfile._id.toString() !== patientId) {
            res.status(403).json({ message: 'Пациенты могут создавать записи только для себя.' });
            return;
        }
        finalPatientId = patientId;
    } else {
        res.status(400).json({ message: 'ID пациента не указан или недостаточно прав' });
        return;
    }
    
    const existingAppointmentForDoctor = await Appointment.findOne({
        doctor: new Types.ObjectId(doctorId), // Используем new Types.ObjectId для явного преобразования
        apptTime: appointmentTime,
        status: { $ne: AppointmentStatus.CANCELLED }
    });

    if (existingAppointmentForDoctor) {
        res.status(409).json({ message: 'Выбранное время у данного врача уже занято' });
        return;
    }

    const appointment = await Appointment.create({
      doctor: new Types.ObjectId(doctorId),
      patient: new Types.ObjectId(finalPatientId),
      apptTime: appointmentTime,
    });

    // --- НОВОЕ: Автоматическая привязка пациента к врачу (и наоборот) ---
    try {
        const patientToUpdate = await Patient.findById(finalPatientId);
        const doctorToUpdate = await Doctor.findById(doctorId); // doctorExists уже загружен, можно использовать его

        if (patientToUpdate && doctorToUpdate) {
            // Добавляем ID врача в массив assignedDoctors пациента, если его там еще нет
            if (!patientToUpdate.assignedDoctors?.find(docId => docId.equals(doctorToUpdate._id))) {
                patientToUpdate.assignedDoctors = patientToUpdate.assignedDoctors || [];
                patientToUpdate.assignedDoctors.push(doctorToUpdate._id);
                await patientToUpdate.save();
                console.log(`[AppointmentController] Врач ${doctorToUpdate._id} прикреплен к пациенту ${patientToUpdate._id}`);
            }

            // Добавляем ID пациента в массив assignedPatients врача, если его там еще нет
            if (!doctorToUpdate.assignedPatients?.find(patId => patId.equals(patientToUpdate._id))) {
                doctorToUpdate.assignedPatients = doctorToUpdate.assignedPatients || [];
                doctorToUpdate.assignedPatients.push(patientToUpdate._id);
                await doctorToUpdate.save();
                console.log(`[AppointmentController] Пациент ${patientToUpdate._id} прикреплен к врачу ${doctorToUpdate._id}`);
            }
        } else {
            if (!patientToUpdate) console.warn(`[AppointmentController] Пациент с ID ${finalPatientId} не найден для обновления связей.`);
            if (!doctorToUpdate) console.warn(`[AppointmentController] Врач с ID ${doctorId} не найден для обновления связей (используйте doctorExists).`);
        }
    } catch (bindingError: any) {
        console.error('[AppointmentController] Ошибка при автоматической привязке врача и пациента:', bindingError);
        // Не прерываем основной процесс создания записи, но логируем ошибку привязки
    }
    // --- КОНЕЦ НОВОГО ---

    console.log(`[AppointmentController] Appointment created with ID: ${appointment._id}`);
    res.status(201).json(appointment);

  } catch (error: any) {
    console.error('[AppointmentController] Ошибка в createAppointment:', error);
    // Проверяем, был ли уже отправлен ответ, прежде чем пытаться отправить снова
    if (!res.headersSent) {
        if (error.name === 'ValidationError') {
            res.status(400).json({ message: 'Ошибка валидации: ' + error.message });
        } else {
            res.status(500).json({ message: 'Ошибка сервера при создании записи на прием' });
        }
    }
  }
};
export const getAllAppointmentsForAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AppointmentController] getAllAppointmentsForAdmin hit by Admin/SuperAdmin');
  try {
    const appointments = await Appointment.find({}) // Найти все
      .populate<{ doctor: Pick<IDoctor, '_id' | 'id' | 'firstName' | 'lastName'> }>({
          path: 'doctor',
          select: 'firstName lastName _id id' // Популируем нужные поля врача
      })
      .populate<{ patient: Pick<IPatient, '_id' | 'id' | 'firstName' | 'lastName'> }>({
          path: 'patient',
          select: 'firstName lastName _id id' // Популируем нужные поля пациента
      })
      .sort({ apptTime: 'desc' }); // Например, сначала самые новые

    res.status(200).json(appointments);
  } catch (error: any) {
    console.error('[AppointmentController] Ошибка в getAllAppointmentsForAdmin:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении всех записей на прием' });
  }
};

export const updateAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const appointmentId = req.params.id;
  // Ожидаем camelCase от фронтенда
  const { doctorId, patientId, apptTime, status } = req.body;

  if (!isValidObjectId(appointmentId)) {
    res.status(400).json({ message: 'Некорректный ID записи на приём' });
    return;
  }

  // Валидация входных данных
  if (!doctorId || !patientId || !apptTime) {
    res.status(400).json({ message: 'ID врача, ID пациента и время приёма обязательны' });
    return;
  }
  if (!isValidObjectId(doctorId) || !isValidObjectId(patientId)) {
    res.status(400).json({ message: 'Некорректный ID врача или пациента' });
    return;
  }
  const appointmentTimeDate = new Date(apptTime);
  if (isNaN(appointmentTimeDate.getTime())) {
    res.status(400).json({ message: 'Некорректный формат времени приёма' });
    return;
  }
  // Валидация статуса, если он передается
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    res.status(400).json({ message: `Некорректный статус. Допустимые: ${Object.values(AppointmentStatus).join(', ')}` });
    return;
  }

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      res.status(404).json({ message: 'Запись на приём не найдена' });
      return;
    }

    // Проверка на существование врача и пациента (опционально, но рекомендуется)
    const doctorExists = await Doctor.findById(doctorId);
    const patientExists = await Patient.findById(patientId);
    if (!doctorExists) {
        res.status(404).json({ message: `Врач с ID ${doctorId} не найден.` });
        return;
    }
    if (!patientExists) {
        res.status(404).json({ message: `Пациент с ID ${patientId} не найден.` });
        return;
    }

    // TODO: Проверка на конфликт времени для нового врача/времени, если они изменились

    appointment.doctor = new Types.ObjectId(doctorId);
    appointment.patient = new Types.ObjectId(patientId);
    appointment.apptTime = appointmentTimeDate;
    if (status) {
      appointment.status = status as AppointmentStatus;
    }

    const updatedAppointment = await appointment.save();
    res.status(200).json(updatedAppointment);
  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в updateAppointmentById (ID: ${appointmentId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении записи' });
  }
};
export const deleteAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const appointmentId = req.params.id;
  console.log(`[AppointmentController] deleteAppointmentById hit. Appointment ID: ${appointmentId}`);

  if (!isValidObjectId(appointmentId)) {
    res.status(400).json({ message: 'Некорректный ID записи' });
    return;
  }
  try {
    const appointment = await Appointment.findByIdAndDelete(appointmentId);
    if (!appointment) {
      res.status(404).json({ message: 'Запись на прием не найдена' });
      return;
    }
    // Здесь можно добавить логику отвязки от пациента/врача, если это не делается при создании
    res.status(200).json({ message: 'Запись на прием успешно удалена' });
  } catch (error: any) {
    console.error(`[AppointmentController] Ошибка в deleteAppointmentById (ID: ${appointmentId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении записи' });
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
    const requestingUserRole = req.user?.roleName; // Уже должно быть из authMiddleware
    let doctorProfileIdForQuery: string | undefined;

    // Эта логика определяет doctorProfileIdForQuery на основе роли и req.params.doctorId
    // или req.user.id для /doctor/me
    // (как мы уже делали ранее)
    if (req.params.doctorId) {
      // Логика для /api/doctors/:doctorId/appointments (если используется)
      if (!['Admin', 'SuperAdmin', 'Doctor'].includes(requestingUserRole!)) {
        res.status(403).json({ message: 'Недостаточно прав для просмотра записей этого врача' });
        return;
      }
      if (!isValidObjectId(req.params.doctorId)) {
        res.status(400).json({ message: 'Некорректный ID врача в URL' });
        return;
      }
      const doctorExists = await Doctor.findById(req.params.doctorId);
      if (!doctorExists) {
          res.status(404).json({ message: `Врач с ID ${req.params.doctorId} не найден.` });
          return;
      }
      // Если админ или суперадмин смотрят, или врач смотрит себя
      if (requestingUserRole === 'Doctor' && doctorExists.user.toString() !== requestingUserId) {
          res.status(403).json({ message: 'Врачи могут просматривать только свои записи.' });
          return;
      }
      doctorProfileIdForQuery = req.params.doctorId;
    } else { // Подразумевается маршрут /api/appointments/doctor/me (для текущего врача)
      if (requestingUserRole !== 'Doctor') {
        res.status(403).json({ message: 'Этот маршрут предназначен только для врачей для просмотра своего расписания.' });
        return;
      }
      const doctorProfile = await Doctor.findOne({ user: requestingUserId });
      if (!doctorProfile) {
        res.status(404).json({ message: 'Профиль врача для текущего пользователя не найден.' });
        return;
      }
      doctorProfileIdForQuery = doctorProfile._id.toString();
    }

    console.log(`[AppointmentController] getDoctorAppointments for doctor profile ID: ${doctorProfileIdForQuery}`);

    const appointments = await Appointment.find({ doctor: doctorProfileIdForQuery })
      .populate<{ patient: Pick<IPatient, '_id' | 'id' | 'firstName' | 'lastName'> }>({ // Уточняем тип для patient
          path: 'patient',
          select: 'firstName lastName _id id' // Загружаем нужные поля пациента
      })
      .sort({ apptTime: 'asc' });

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