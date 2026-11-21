import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.js";
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import module0 from './modules/organizations/routes.js';
import module1 from './modules/profiles/routes.js';
import module2 from './modules/caretaker-assignments/routes.js';
import module3 from './modules/family-contacts/routes.js';
import module4 from './modules/medications/routes.js';
import module5 from './modules/dose-logs/routes.js';
import module6 from './modules/notifications/routes.js';
import module7 from './modules/notification-recipients/routes.js';
import module8 from './modules/adherence-scores/routes.js';

export function createApp(pool) {
  const app = express();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.disable('x-powered-by');
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json({ limit: '64kb' }));
  app.get('/health', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ message: 'API running', database: 'connected' });
  });
  app.use('/api/organizations', module0(pool));
  app.use('/api/profiles', module1(pool));
  app.use('/api/caretaker-assignments', module2(pool));
  app.use('/api/family-contacts', module3(pool));
  app.use('/api/medications', module4(pool));
  app.use('/api/dose-logs', module5(pool));
  app.use('/api/notifications', module6(pool));
  app.use('/api/notification-recipients', module7(pool));
  app.use('/api/adherence-scores', module8(pool));
  app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  app.use(errorHandler);
  return app;
}
