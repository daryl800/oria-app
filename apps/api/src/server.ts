import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import logger from 'jet-logger';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';

import Paths from '@src/common/constants/Paths';
import { RouteError } from '@src/common/utils/route-errors';
import BaseRouter from '@src/routes/apiRouter';
import EnvVars, { NodeEnvs } from './common/constants/env';
import personsRouter from '@src/routes/persons';
import compareRouter from '@src/routes/compare';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'https://app.oria.io',
  'https://oriacompass.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(cors({
  origin: EnvVars.NodeEnv === NodeEnvs.DEV ? true : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o) || origin === o)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

if (EnvVars.NodeEnv === NodeEnvs.DEV) {
  app.use(morgan('dev'));
}

if (EnvVars.NodeEnv === NodeEnvs.PRODUCTION) {
  app.use(helmet());
}

app.use(Paths._, BaseRouter);

app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
    logger.err(err, true);
  }
  if (err instanceof RouteError) {
    res.status(err.status).json({ error: err.message });
  }
  return next(err);
});

const viewsDir = path.join(__dirname, 'views');
app.set('views', viewsDir);

const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

app.get('/', (_: Request, res: Response) => {
  return res.redirect('/users');
});

app.get('/users', (_: Request, res: Response) => {
  return res.sendFile('users.html', { root: viewsDir });
});

app.use('/api/persons', personsRouter);
app.use('/api/compare', compareRouter);

export default app;
