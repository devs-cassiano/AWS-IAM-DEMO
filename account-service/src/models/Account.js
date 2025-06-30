const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} AccountData
 * @property {string} id - Unique account identifier
 * @property {string} name - Account/organization name
 * @property {string} email - Administrator email
 * @property {string} status - Account status (active, suspended, deleted)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class Account {
  /**
   * Creates a new Account instance
   * @param {Object} data - Account data
   * @param {string} data.name - Account name
   * @param {string} data.email - Administrator email
   * @param {string} [data.status='active'] - Account status
   * @param {string} [data.id] - Account ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.email = data.email;
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates account data
   * @param {Object} data - Data to validate
   * @param {string} data.name - Account name
   * @param {string} data.email - Administrator email
   * @throws {Error} If validation fails
   * @returns {Object} Validated data
   */
  static validate(data) {
    const errors = [];

    // Validate name
    if (!data.name) {
      errors.push('Name is required');
    } else if (typeof data.name !== 'string') {
      errors.push('Name must be a string');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 255) {
      errors.push('Name must be at most 255 characters');
    }

    // Validate email
    if (!data.email) {
      errors.push('Email is required');
    } else if (typeof data.email !== 'string') {
      errors.push('Email must be a string');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Email must be valid');
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
   * Returns JSON representation of the account
   * @returns {Object} Account data
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      status: this.status,
      arn: this.getArn(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Returns the ARN (Amazon Resource Name) for this account
   * @param {string} [region=''] - AWS region (optional for account resources)
   * @returns {string} The ARN of the account
   */
  getArn(region = '') {
    return `arn:aws:organizations::${this.id}:account/o-example/${this.id}`;
  }
}

module.exports = { Account };
