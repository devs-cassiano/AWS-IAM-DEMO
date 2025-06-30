const express = require('express');
const bcrypt = require('bcrypt');
const { AccountController } = require('../controllers/AccountController');
const { AccountService } = require('../services/AccountService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');
const { requirePermission } = require('../middleware/authorization');

const router = express.Router();

// Initialize dependencies with repository factory
const accountRepository = repositoryFactory.createAccountRepository();
const userRepository = repositoryFactory.createUserRepository();

const accountService = new AccountService(accountRepository, userRepository, bcrypt);
const accountController = new AccountController(accountService);

// Account routes with authorization (except create account which is public)
router.post('/', accountController.createAccount.bind(accountController)); // Public - create account

router.get('/:id', 
  requirePermission('iam', 'GetAccount', (req) => `account/${req.params.id}`),
  accountController.getAccountById.bind(accountController)
);

router.get('/', 
  requirePermission('iam', 'ListAccounts', 'account/*'),
  accountController.getAllAccounts.bind(accountController)
);

router.put('/:id', 
  requirePermission('iam', 'UpdateAccount', (req) => `account/${req.params.id}`),
  accountController.updateAccount.bind(accountController)
);

router.delete('/:id', 
  requirePermission('iam', 'DeleteAccount', (req) => `account/${req.params.id}`),
  accountController.deleteAccount.bind(accountController)
);

/**
 * Create account-specific user routes
 * For listing users by account ID
 * Protected by authentication and account access middleware (applied in app.js)
 */
function createAccountUserRoutes() {
  const { UserController } = require('../controllers/UserController');
  const { UserService } = require('../services/UserService');
  
  const router = express.Router();
  
  const userRepository = repositoryFactory.createUserRepository();
  const userService = new UserService(userRepository, bcrypt);
  const userController = new UserController(userService);

  // Account-specific user endpoints with authorization
  router.get('/:accountId/users', 
    requirePermission('iam', 'ListUsers', (req) => `account/${req.params.accountId}/user/*`),
    userController.getUsersByAccountId.bind(userController)
  );
  
  return router;
}

// Export router and dependencies
module.exports = {
  router,
  createAccountUserRoutes
};
