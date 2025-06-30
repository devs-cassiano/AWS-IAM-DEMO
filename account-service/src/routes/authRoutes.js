const express = require('express');
const bcrypt = require('bcrypt');
const { AuthController } = require('../controllers/AuthController');
const { AuthService } = require('../services/AuthService');
const { UserService } = require('../services/UserService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 refresh requests per windowMs
  message: {
    success: false,
    error: 'Too many refresh attempts, please try again later.',
  },
});

/**
 * Create enhanced authentication routes with JWT support
 */
function createEnhancedAuthRoutes() {
  const router = express.Router();
  
  const userRepository = repositoryFactory.createUserRepository();
  const userService = new UserService(userRepository, bcrypt);
  
  // Passar o pool do banco para o AuthService para blacklist híbrida
  const dbPool = repositoryFactory.pool;
  const authService = new AuthService(userService, dbPool);
  const authController = new AuthController(authService);

  // Authentication endpoints with rate limiting
  router.post('/login', authLimiter, authController.login.bind(authController));
  router.post('/login-iam', authLimiter, authController.loginIAM.bind(authController));
  router.post('/refresh', refreshLimiter, authController.refresh.bind(authController));
  router.post('/logout', authController.logout.bind(authController));
  router.post('/validate', authController.validateToken.bind(authController));

  return router;
}

module.exports = { createEnhancedAuthRoutes };
