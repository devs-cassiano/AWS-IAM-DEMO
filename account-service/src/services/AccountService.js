const { Account } = require('../models/Account.js');
const { User } = require('../models/User.js');
const { Role } = require('../models/Role.js');
const { Policy } = require('../models/Policy.js');
const { Transaction } = require('../utils/Transaction.js');
const { DefaultRoleService } = require('./DefaultRoleService');

/**
 * Service for Account business logic
 * Orchestrates account creation, updates, and management
 */
class AccountService {
  /**
   * Creates a new AccountService instance
   * @param {Object} accountRepository - Account repository instance
   * @param {Object} userRepository - User repository instance  
   * @param {Object} bcrypt - Bcrypt instance for password hashing
   * @param {Object} roleRepository - Role repository instance (optional, for testing)
   * @param {Object} policyRepository - Policy repository instance (optional, for testing)
   * @param {Object} userRoleRepository - UserRole repository instance (optional, for testing)
   */
  constructor(accountRepository, userRepository, bcrypt, roleRepository = null, policyRepository = null, userRoleRepository = null) {
    this.accountRepository = accountRepository;
    this.userRepository = userRepository;
    this.bcrypt = bcrypt;
    
    // Initialize repositories for roles and policies
    if (roleRepository && policyRepository && userRoleRepository) {
      // Use provided repositories (for testing)
      this.roleRepository = roleRepository;
      this.policyRepository = policyRepository;
      this.userRoleRepository = userRoleRepository;
    } else {
      // Use RepositoryFactory (for production)
      const { repositoryFactory } = require('../repositories/RepositoryFactory');
      this.roleRepository = repositoryFactory.createRoleRepository();
      this.policyRepository = repositoryFactory.createPolicyRepository();
      this.userRoleRepository = repositoryFactory.createUserRoleRepository();
    }
    
    // Initialize DefaultRoleService
    this.defaultRoleService = new DefaultRoleService(
      this.roleRepository,
      this.policyRepository,
      this.userRoleRepository
    );
  }

  /**
   * Creates a new account with root user
   * @param {Object} accountData - Account creation data
   * @param {string} accountData.name - Account name
   * @param {string} accountData.email - Administrator email
   * @param {string} accountData.password - Root user password
   * @param {Object} [accountData.rootUser] - Root user details
   * @returns {Promise<{account: Account, rootUser: User}>} Created account and root user
   * @throws {Error} If validation fails or email already exists
   */
  async createAccount(accountData) {
    try {
      // 1. Validate account data
      Account.validate(accountData);
      
      // Also validate password for root user
      if (!accountData.password || accountData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // 2. Check if email already exists
      const existingAccount = await this.accountRepository.findByEmail(accountData.email);
      if (existingAccount) {
        throw new Error('Email already registered');
      }

      // 3. Execute account creation in a transaction
      const result = await Transaction.execute(async (transaction) => {
        // Create account
        const account = new Account({
          name: accountData.name,
          email: accountData.email
        });

        const createdAccount = await this.accountRepository.createWithTransaction(account, transaction);

        // Create root user with enhanced data
        const hashedPassword = await this.bcrypt.hash(accountData.password, 10);
        
        // Extract root user data with defaults
        const rootUserData = accountData.rootUser || {};
        
        const rootUser = new User({
          accountId: createdAccount.id,
          username: rootUserData.username || 'root',
          email: accountData.email, // Root user inherits account email
          firstName: rootUserData.firstName || 'Root',
          lastName: rootUserData.lastName || 'User',
          passwordHash: hashedPassword,
          isRoot: true,
          isActive: true
        });

        const createdRootUser = await this.userRepository.createWithTransaction(rootUser, transaction);

        return {
          account: createdAccount,
          rootUser: createdRootUser
        };
      });

      // Initialize default system roles (if not already done)
      await this.defaultRoleService.initializeDefaultRoles();
      
      // Assign default role to the root user AFTER transaction commit
      try {
        await this.defaultRoleService.assignDefaultRoleToUser(result.rootUser.id, 'root');
        console.log(`✅ Assigned root role to user ${result.rootUser.id}`);
      } catch (roleError) {
        console.error('Failed to assign default role to root user:', roleError.message);
        // Don't fail account creation if role assignment fails
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets an account by ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Account>} Account instance
   * @throws {Error} If account not found
   */
  async getAccountById(accountId) {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  /**
   * Gets all accounts with pagination
   * @param {Object} options - Query options
   * @param {number} [options.page] - Page number
   * @param {number} [options.limit] - Items per page
   * @returns {Promise<Account[]>} Array of Account instances
   */
  async getAllAccounts(options = {}) {
    return await this.accountRepository.findAll(options);
  }

  /**
   * Updates an account
   * @param {string} accountId - Account ID to update
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - New account name
   * @param {string} [updateData.status] - New account status
   * @returns {Promise<Account>} Updated account
   * @throws {Error} If account not found
   */
  async updateAccount(accountId, updateData) {
    // 1. Find existing account
    const existingAccount = await this.accountRepository.findById(accountId);
    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // 2. Prepare update data with only the fields that can be updated
    const updates = {
      name: updateData.name || existingAccount.name,
      status: updateData.status || existingAccount.status,
      updated_at: new Date()
    };

    // 3. Update in database
    return await this.accountRepository.update(accountId, updates);
  }

  /**
   * Deletes an account
   * @param {string} accountId - Account ID to delete
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If account not found
   */
  async deleteAccount(accountId) {
    // 1. Check if account exists
    const existingAccount = await this.accountRepository.findById(accountId);
    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // 2. Delete account (this should cascade delete users in real DB)
    return await this.accountRepository.delete(accountId);
  }
}

module.exports = { AccountService };
