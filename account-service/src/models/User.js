const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} UserData
 * @property {string} id - Unique user identifier
 * @property {string} accountId - Account ID this user belongs to
 * @property {string} username - Username
 * @property {string} email - User email
 * @property {string} passwordHash - Hashed password
 * @property {boolean} isRoot - Whether this is the root user
 * @property {string} status - User status (active, suspended, deleted)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class User {
  /**
   * Creates a new User instance
   * @param {Object} data - User data
   * @param {string} data.accountId - Account ID
   * @param {string} data.username - Username
   * @param {string} data.email - User email
   * @param {string} data.passwordHash - Hashed password
   * @param {boolean} [data.isRoot=false] - Whether this is the root user
   * @param {string} [data.status='active'] - User status
   * @param {string} [data.id] - User ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.isRoot = data.isRoot || false;
    
    // firstName and lastName are only for root users
    if (this.isRoot) {
      this.firstName = data.firstName || null;
      this.lastName = data.lastName || null;
    }
    
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates user data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.username - Username
   * @param {string} data.email - User email
   * @param {string} data.password - Password (for validation)
   * @throws {Error} If validation fails
   * @returns {Object} Validated data
   */
  static validate(data) {
    const errors = [];

    // Validate accountId
    if (!data.accountId) {
      errors.push('Account ID is required');
    } else if (typeof data.accountId !== 'string') {
      errors.push('Account ID must be a string');
    }

    // Validate username
    if (!data.username) {
      errors.push('Username is required');
    } else if (typeof data.username !== 'string') {
      errors.push('Username must be a string');
    } else if (data.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (data.username.length > 50) {
      errors.push('Username must be at most 50 characters');
    }

    // Validate email (required for root users, optional for IAM users)
    if (data.isRoot && !data.email) {
      errors.push('Email is required for root users');
    } else if (data.email && typeof data.email !== 'string') {
      errors.push('Email must be a string');
    } else if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email must be valid');
    }

    // Validate password
    if (!data.password) {
      errors.push('Password is required');
    } else if (!this.isValidPassword(data.password)) {
      errors.push('Password must be at least 6 characters');
    }

    // Validate status if provided
    if (data.status && !['active', 'suspended', 'deleted'].includes(data.status)) {
      errors.push('Status must be one of: active, suspended, deleted');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]); // Return first error for simplicity
    }

    return data;
  }

  /**
   * Validates email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength
   * @param {string} password - Password to validate
   * @returns {boolean} True if valid, false otherwise
   */
  static isValidPassword(password) {
    if (!password || typeof password !== 'string') {
      return false;
    }
    return password.length >= 6;
  }

  /**
   * Returns JSON representation of the user (without password hash)
   * @returns {Object} User data without sensitive information
   */
  toJSON() {
    const result = {
      id: this.id,
      accountId: this.accountId,
      username: this.username,
      isRoot: this.isRoot,
      status: this.status,
      arn: this.getArn(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Only include email if it exists (for root users or IAM users with email)
    if (this.email) {
      result.email = this.email;
    }

    // Include firstName and lastName only for root users
    if (this.isRoot) {
      if (this.firstName) {
        result.firstName = this.firstName;
      }
      if (this.lastName) {
        result.lastName = this.lastName;
      }
    }

    return result;
  }

  /**
   * Gets the ARN for this user
   * @returns {string} User ARN
   */
  getArn() {
    return `arn:aws:iam::${this.accountId}:user/${this.username}`;
  }
}

module.exports = { User };
