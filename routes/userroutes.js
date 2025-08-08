import express from 'express';
import { UserController } from '../controllers/usercontroller.js';

import { authenticateToken, authenticateTempToken } from '../middleware/auth.js';
import { validateProfileCompletion } from '../middleware/validation.js';

export const createUserRoutes = (pool) => {
  const router = express.Router();
  const userController = new UserController(pool);

  // Profile routes
  router.post('/complete-profile', authenticateTempToken, validateProfileCompletion, (req, res) => userController.completeProfile(req, res));
  router.get('/profile', authenticateToken, (req, res) => userController.getProfile(req, res));

  return router;
};