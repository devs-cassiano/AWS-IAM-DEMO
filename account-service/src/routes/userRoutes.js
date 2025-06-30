const express = require('express');
const bcrypt = require('bcrypt');
const { UserController } = require('../controllers/UserController');
const { UserService } = require('../services/UserService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');
const { requirePermission, requireUserManagement, requireUserAccess } = require('../middleware/authorization');

/**
 * Create user routes with full CRUD operations
 * Protected by authentication middleware (applied in app.js) and authorization
 */
function createUserRoutes() {
  const router = express.Router();
  
  const userRepository = repositoryFactory.createUserRepository();
  const userService = new UserService(userRepository, bcrypt);
  const userController = new UserController(userService);

  // User CRUD endpoints with authorization
  router.get('/', 
    requirePermission('iam', 'ListUsers', 'user/*'),
    userController.getUsersFromToken.bind(userController)
  );  // Get current user's roles
  router.get('/roles', 
    userController.getCurrentUserRoles.bind(userController)
  );
  
  router.post('/', 
    requireUserManagement(),
    userController.createUser.bind(userController)
  );
  
  router.get('/:id', 
    requirePermission('iam', 'GetUser', (req) => `user/${req.params.id}`),
    userController.getUserById.bind(userController)
  );
  
  router.put('/:id', 
    requirePermission('iam', 'UpdateUser', (req) => `user/${req.params.id}`),
    userController.updateUser.bind(userController)
  );
  
  router.put('/:id/password', 
    requirePermission('iam', 'UpdateUserPassword', (req) => `user/${req.params.id}`),
    userController.updateUserPassword.bind(userController)
  );
  
  router.delete('/:id', 
    requirePermission('iam', 'DeleteUser', (req) => `user/${req.params.id}`),
    userController.deleteUser.bind(userController)
  );

  return router;
}

module.exports = { 
  createUserRoutes
};
