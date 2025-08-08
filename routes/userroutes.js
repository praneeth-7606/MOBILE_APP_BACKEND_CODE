import express from 'express';

export const createUserRoutes = (userController, authMiddleware) => {
  const router = express.Router();

  router.post('/complete-profile', userController.completeProfile);
  router.get('/profile', authMiddleware, userController.getProfile);

  return router;
};