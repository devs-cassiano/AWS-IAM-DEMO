const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} GroupData
 * @property {string} id - Unique group identifier
 * @property {string} accountId - Account ID this group belongs to
 * @property {string} name - Group name
 * @property {string} description - Group description
 * @property {string} path - Group path (for hierarchical organization)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class Group {
  /**
   * Creates a new Group instance
   * @param {Object} data - Group data
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Group name
   * @param {string} [data.description] - Group description
   * @param {string} [data.path='/'] - Group path
   * @param {string} [data.id] - Group ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.name = data.name;
    this.description = data.description || '';
    this.path = data.path || '/';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates this group instance
   * @throws {Error} If validation fails
   */
  validate() {
    return Group.validate(this);
  }

  /**
   * Validates group data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Group name
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

    // Validate name
    if (!data.name) {
      errors.push('Group name is required');
    } else if (typeof data.name !== 'string') {
      errors.push('Group name must be a string');
    } else if (data.name.length < 1) {
      errors.push('Group name is required');
    } else if (data.name.length > 128) {
      errors.push('Group name must be 128 characters or less');
    } else if (!/^[a-zA-Z0-9+=,.@_-]+$/.test(data.name)) {
      errors.push('Group name can only contain alphanumeric characters and +=,.@_-');
    }

    // Validate path if provided
    if (data.path && typeof data.path !== 'string') {
      errors.push('Path must be a string');
    } else if (data.path && !data.path.startsWith('/')) {
      errors.push('Path must start with /');
    } else if (data.path && data.path !== '/' && !data.path.endsWith('/')) {
      errors.push('Path must end with / (except for root path)');
    }

    // Validate description if provided
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description && data.description.length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]); // Return first error for simplicity
    }

    return data;
  }

  /**
   * Creates a Group from database row data
   * @param {Object} row - Database row data
   * @returns {Group} Group instance
   */
  static fromDatabaseRow(row) {
    return new Group({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      description: row.description,
      path: row.path,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Creates a Group from JSON data
   * @param {Object} jsonData - JSON data
   * @returns {Group} Group instance
   */
  static fromJSON(jsonData) {
    const data = { ...jsonData };
    
    // Convert string dates to Date objects
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    return new Group(data);
  }

  /**
   * Returns JSON representation of the group
   * @returns {Object} Group data
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      description: this.description,
      path: this.path,
      arn: this.getArn(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Returns the ARN (Amazon Resource Name) for this group
   * @param {string} [region=''] - AWS region (optional for IAM resources)
   * @returns {string} The ARN of the group
   */
  getArn(region = '') {
    return `arn:aws:iam::${this.accountId}:group${this.path}${this.name}`;
  }
}

module.exports = { Group };
