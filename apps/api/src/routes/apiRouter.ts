import { Router } from 'express';
import Paths from '@src/common/constants/Paths';
import UserRoutes from './UserRoutes';
import dailyGuidanceRouter from './dailyGuidance';
import profileRouter from './profile';
import { authMiddleware } from '../middleware/auth';

const apiRouter = Router();

// users router (existing)
const userRouter = Router();
userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);
apiRouter.use(Paths.Users._, userRouter);

// oria routes (auth protected)
apiRouter.use(Paths.DailyGuidance._, authMiddleware, dailyGuidanceRouter);
apiRouter.use(Paths.Profile._, authMiddleware, profileRouter);

export default apiRouter;
