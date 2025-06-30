const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} PolicyAttachmentData
 * @property {string} id - Unique attachment identifier
 * @property {string} accountId - Account ID
 * @property {string} policyId - Policy ID
 * @property {string} targetType - Type of target (user, group)
 * @property {string} targetId - ID of the target (user ID or group ID)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class PolicyAttachment {
  /**
   * Creates a new PolicyAttachment instance
   * @param {Object} data - Attachment data
   * @param {string} data.accountId - Account ID
   * @param {string} data.policyId - Policy ID
   * @param {string} data.targetType - Target type (user, group)
   * @param {string} data.targetId - Target ID
   * @param {string} [data.id] - Attachment ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.policyId = data.policyId;
    this.targetType = data.targetType;
    this.targetId = data.targetId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates policy attachment data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.policyId - Policy ID
   * @param {string} data.targetType - Target type
   * @param {string} data.targetId - Target ID
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

    // Validate policyId
    if (!data.policyId) {
      errors.push('Policy ID is required');
    } else if (typeof data.policyId !== 'string') {
      errors.push('Policy ID must be a string');
    }

    // Validate targetType
    if (!data.targetType) {
      errors.push('Target type is required');
    } else if (!['user', 'group'].includes(data.targetType)) {
      errors.push('Target type must be either "user" or "group"');
    }

    // Validate targetId
    if (!data.targetId) {
      errors.push('Target ID is required');
    } else if (typeof data.targetId !== 'string') {
      errors.push('Target ID must be a string');
    }

    if (errors.length > 0) {
      const error = new Error('Policy attachment validation failed');
      error.details = errors;
      throw error;
    }

    return data;
  }

  /**
   * Creates a copy of the attachment for updating
   * @returns {PolicyAttachment} New PolicyAttachment instance
   */
  clone() {
    return new PolicyAttachment({
      id: this.id,
      accountId: this.accountId,
      policyId: this.policyId,
      targetType: this.targetType,
      targetId: this.targetId,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * Converts the attachment to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      policyId: this.policyId,
      targetType: this.targetType,
      targetId: this.targetId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a PolicyAttachment instance from database row
   * @param {Object} row - Database row
   * @returns {PolicyAttachment} PolicyAttachment instance
   */
  static fromDatabaseRow(row) {
    return new PolicyAttachment({
      id: row.id,
      accountId: row.account_id,
      policyId: row.policy_id,
      targetType: row.target_type,
      targetId: row.target_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Creates a user policy attachment
   * @param {Object} data - Attachment data
   * @param {string} data.accountId - Account ID
   * @param {string} data.policyId - Policy ID
   * @param {string} data.userId - User ID
   * @returns {PolicyAttachment} New PolicyAttachment instance
   */
  static forUser(data) {
    return new PolicyAttachment({
      accountId: data.accountId,
      policyId: data.policyId,
      targetType: 'user',
      targetId: data.userId
    });
  }

  /**
   * Creates a group policy attachment
   * @param {Object} data - Attachment data
   * @param {string} data.accountId - Account ID
   * @param {string} data.policyId - Policy ID
   * @param {string} data.groupId - Group ID
   * @returns {PolicyAttachment} New PolicyAttachment instance
   */
  static forGroup(data) {
    return new PolicyAttachment({
      accountId: data.accountId,
      policyId: data.policyId,
      targetType: 'group',
      targetId: data.groupId
    });
  }

  /**
   * Creates a role policy attachment
   * @param {Object} data - Attachment data
   * @param {string} data.accountId - Account ID
   * @param {string} data.policyId - Policy ID
   * @param {string} data.roleId - Role ID
   * @returns {PolicyAttachment} New PolicyAttachment instance
   */
  static forRole(data) {
    return new PolicyAttachment({
      accountId: data.accountId,
      policyId: data.policyId,
      targetType: 'role',
      targetId: data.roleId
    });
  }

  /**
   * Checks if this attachment is for a user
   * @returns {boolean} True if target type is user
   */
  isUserAttachment() {
    return this.targetType === 'user';
  }

  /**
   * Checks if this attachment is for a group
   * @returns {boolean} True if target type is group
   */
  isGroupAttachment() {
    return this.targetType === 'group';
  }

  /**
   * Checks if this attachment is for a role
   * @returns {boolean} True if target type is role
   */
  isRoleAttachment() {
    return this.targetType === 'role';
  }
}

module.exports = PolicyAttachment;
