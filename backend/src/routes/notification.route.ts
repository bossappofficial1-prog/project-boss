import { Router } from 'express';
import { getNotificationsController } from '../controller/notification.controller';
import { authorize, protect } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const notificationRouter = Router();

notificationRouter.use(protect);
notificationRouter.get('/', authorize(UserRole.OWNER), getNotificationsController);

export default notificationRouter;
