const { User } = require('../models/User');
const { DefaultRoleService } = require('./DefaultRoleService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');

/**
 * UserService class for managing user business logic
 * Handles user operations including creation, authentication, and management
 */
class UserService {
  /**
   * Creates a new UserService instance
   * @param {Object} userRepository - User repository instance
   * @param {Object} bcrypt - Bcrypt instance for password hashing
   */
  constructor(userRepository, bcrypt) {
    this.userRepository = userRepository;
    this.bcrypt = bcrypt;
    
    // Initialize DefaultRoleService with required repositories
    this.defaultRoleService = new DefaultRoleService(
      repositoryFactory.createRoleRepository(),
      repositoryFactory.createPolicyRepository(),
      repositoryFactory.createUserRoleRepository()
    );
  }

  /**
   * Creates a new user
   * @param {Object} userData - User creation data
   * @param {string} userData.accountId - Account ID
   * @param {string} userData.username - Username
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {boolean} [userData.isRoot=false] - Whether user is root
   * @returns {Promise<User>} Created user instance
   * @throws {Error} If validation fails or email already exists
   */
  async createUser(userData) {
    try {
      const isRoot = userData.isRoot || false;
      
      if (isRoot) {
        // Root user must provide email and password
        if (!userData.email) {
          throw new Error('Root user email is required');
        }
        
        if (!userData.password || userData.password.length < 6) {
          throw new Error('Root user password must be at least 6 characters');
        }
        
        // Check if email already exists for root users
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
          throw new Error('Email already registered');
        }
        
        // Hash the provided password
        const hashedPassword = await this.bcrypt.hash(userData.password, 10);

        // Create root user
        const user = new User({
          accountId: userData.accountId,
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          isRoot: true,
          status: 'active'
        });

        const createdUser = await this.userRepository.create(user);
        
        return {
          user: createdUser,
          generatedPassword: null // No generated password for root users
        };
      } else {
        // IAM user - only username required, email is optional
        if (!userData.username) {
          throw new Error('Username is required for IAM users');
        }
        
        // Check if username already exists in this account for IAM users
        const existingUser = await this.userRepository.findByUsernameAndAccount(userData.username, userData.accountId);
        if (existingUser) {
          throw new Error('Username already exists in this account');
        }
        
        // Generate password for IAM user
        const generatedPassword = this.generateIAMPassword();
        const hashedPassword = await this.bcrypt.hash(generatedPassword, 10);

        // Create IAM user (email is optional, can be null)
        // For IAM users without email, generate a system email
        let userEmail = userData.email;
        if (!userEmail) {
          // Generate system email for IAM users: username@iam.{accountId}.internal
          userEmail = `${userData.username}@iam.${userData.accountId}.internal`;
        }

        const user = new User({
          accountId: userData.accountId,
          username: userData.username,
          email: userEmail,
          passwordHash: hashedPassword,
          isRoot: false,
          status: 'active'
        });

        const createdUser = await this.userRepository.create(user);
        
        // Assign default role to IAM user
        try {
          await this.defaultRoleService.assignDefaultRoleToUser(createdUser.id, 'iam');
        } catch (roleError) {
          console.error('Failed to assign default role to IAM user:', roleError.message);
          // Don't fail user creation if role assignment fails
        }
        
        return {
          user: createdUser,
          generatedPassword: generatedPassword
        };
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generates a secure password for IAM users
   * @returns {string} Generated password
   */
  generateIAMPassword() {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Gets a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User>} User instance
   * @throws {Error} If user not found
   */
  async getUserById(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Gets all users for a specific account
   * @param {string} accountId - Account ID
   * @returns {Promise<User[]>} Array of User instances
   */
  async getUsersByAccountId(accountId) {
    return await this.userRepository.findByAccountId(accountId);
  }

  /**
   * Updates a user
   * @param {string} userId - User ID to update
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.username] - New username
   * @param {string} [updateData.email] - New email
   * @param {string} [updateData.status] - New status
   * @returns {Promise<User>} Updated user
   * @throws {Error} If user not found
   */
  async updateUser(userId, updateData, currentUser = null) {
    // 1. Find existing user
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // 2. Check permissions and prepare update object
    const updates = {};
    
    // Check if current user is trying to update themselves or another user
    const isUpdatingSelf = currentUser && currentUser.userId === userId;
    const isRootUser = currentUser && currentUser.isRoot;
    
    if (existingUser.isRoot) {
      // Root user updating themselves
      if (!isUpdatingSelf) {
        throw new Error('Root users can only be updated by themselves');
      }
      
      // Root user can update: firstName, lastName, password (but NOT email)
      if (updateData.firstName !== undefined) {
        updates.firstName = updateData.firstName;
      }
      
      if (updateData.lastName !== undefined) {
        updates.lastName = updateData.lastName;
      }
      
      if (updateData.password) {
        if (updateData.password.length < 6) {
          throw new Error('Root user password must be at least 6 characters');
        }
        const hashedPassword = await this.bcrypt.hash(updateData.password, 10);
        updates.passwordHash = hashedPassword;
      }
      
      // Root users cannot change email, username, or status
      if (updateData.email !== undefined) {
        throw new Error('Root users cannot change their email address');
      }
      if (updateData.username !== undefined) {
        throw new Error('Root users cannot change their username');
      }
      if (updateData.status !== undefined) {
        throw new Error('Root users cannot change their status');
      }
    } else {
      // IAM user - only root can update IAM users' status
      if (!isRootUser) {
        throw new Error('IAM users cannot update their own data. Updates depend on assigned roles and policies');
      }
      
      // Root user can update IAM user's status only
      if (updateData.status && updateData.status !== existingUser.status) {
        // Validate status values
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(updateData.status)) {
          throw new Error('Status must be one of: active, inactive, suspended');
        }
        updates.status = updateData.status;
      }
      
      // IAM users don't have firstName/lastName and other fields cannot be changed
      if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
        throw new Error('IAM users do not have firstName/lastName fields');
      }
      if (updateData.username !== undefined) {
        throw new Error('IAM user username cannot be changed');
      }
      if (updateData.email !== undefined) {
        throw new Error('IAM user email cannot be changed');
      }
      if (updateData.password !== undefined) {
        throw new Error('IAM user password cannot be changed through this endpoint');
      }
    }

    // 3. Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return existingUser; // No changes, return existing user
    }

    // 4. Update in database
    return await this.userRepository.update(userId, updates);
  }

  /**
   * Updates a user's password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<User>} Updated user
   * @throws {Error} If user not found or current password is incorrect
   */
  async updateUserPassword(userId, oldPassword, newPassword) {
    // 1. Find existing user
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // 2. Verify current password
    const isCurrentPasswordValid = await this.bcrypt.compare(oldPassword, existingUser.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // 3. Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // 4. Hash new password
    const newHashedPassword = await this.bcrypt.hash(newPassword, 10);

    // 5. Create updated user object
    const updatedUser = new User({
      id: existingUser.id,
      accountId: existingUser.accountId,
      username: existingUser.username,
      email: existingUser.email,
      passwordHash: newHashedPassword,
      isRoot: existingUser.isRoot,
      status: existingUser.status,
      createdAt: existingUser.createdAt,
      updatedAt: new Date()
    });

    // 6. Update in database
    return await this.userRepository.update(updatedUser);
  }

  /**
   * Deletes a user
   * @param {string} userId - User ID to delete
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If user not found or trying to delete root user
   */
  async deleteUser(userId) {
    // 1. Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // 2. Prevent deletion of root user
    if (existingUser.isRoot) {
      throw new Error('Cannot delete root user');
    }

    // 3. Delete user
    return await this.userRepository.delete(userId);
  }

  /**
   * Authenticates a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User|null>} User instance if authenticated, null otherwise
   */
  async authenticateUser(email, password) {
    try {
      // 1. Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      // 2. Check if user is active
      if (user.status !== 'active') {
        return null;
      }

      // 3. Verify password
      const isPasswordValid = await this.bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      // Log error but don't expose details for security
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * Authenticate IAM user with accountId + username + password
   * @param {string} accountId - Account ID
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<User|null>} User if authenticated, null otherwise
   */
  async authenticateIAMUser(accountId, username, password) {
    try {
      // Find user by username and account ID
      const user = await this.userRepository.findByUsernameAndAccount(username, accountId);
      
      if (!user) {
        return null;
      }

      // Check if user is active (IAM users with inactive status cannot login)
      if (user.status !== 'active') {
        throw new Error(`User account is ${user.status}. Only active users can login`);
      }

      // Verify password
      const isPasswordValid = await this.bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { UserService };
