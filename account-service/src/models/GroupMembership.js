const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} GroupMembershipData
 * @property {string} id - Unique membership identifier
 * @property {string} accountId - Account ID
 * @property {string} groupId - Group ID
 * @property {string} userId - User ID
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class GroupMembership {
  /**
   * Creates a new GroupMembership instance
   * @param {Object} data - Membership data
   * @param {string} data.accountId - Account ID
   * @param {string} data.groupId - Group ID
   * @param {string} data.userId - User ID
   * @param {string} [data.id] - Membership ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.groupId = data.groupId;
    this.userId = data.userId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates group membership data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.groupId - Group ID
   * @param {string} data.userId - User ID
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

    // Validate groupId
    if (!data.groupId) {
      errors.push('Group ID is required');
    } else if (typeof data.groupId !== 'string') {
      errors.push('Group ID must be a string');
    }

    // Validate userId
    if (!data.userId) {
      errors.push('User ID is required');
    } else if (typeof data.userId !== 'string') {
      errors.push('User ID must be a string');
    }

    if (errors.length > 0) {
      const error = new Error('Group membership validation failed');
      error.details = errors;
      throw error;
    }

    return data;
  }

  /**
   * Creates a copy of the membership for updating
   * @returns {GroupMembership} New GroupMembership instance
   */
  clone() {
    return new GroupMembership({
      id: this.id,
      accountId: this.accountId,
      groupId: this.groupId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * Converts the membership to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      groupId: this.groupId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a GroupMembership instance from database row
   * @param {Object} row - Database row
   * @returns {GroupMembership} GroupMembership instance
   */
  static fromDatabaseRow(row) {
    return new GroupMembership({
      id: row.id,
      accountId: row.account_id,
      groupId: row.group_id,
      userId: row.user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}

module.exports = GroupMembership;
