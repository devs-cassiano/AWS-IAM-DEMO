const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * @typedef {Object} RoleSessionData
 * @property {string} id - Unique session identifier
 * @property {string} accountId - Account ID
 * @property {string} roleId - Role ID
 * @property {string} [userId] - User ID (null for external principals)
 * @property {string} sessionName - Session name
 * @property {string} [externalId] - External ID for cross-account access
 * @property {string} [sourceIp] - Source IP address
 * @property {string} [userAgent] - User agent string
 * @property {Date} assumedAt - When the role was assumed
 * @property {Date} expiresAt - When the session expires
 * @property {string} sessionTokenHash - Hash of the session token
 * @property {boolean} isActive - Whether the session is active
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class RoleSession {
  /**
   * Creates a new RoleSession instance
   * @param {Object} data - Session data
   * @param {string} data.accountId - Account ID
   * @param {string} data.roleId - Role ID
   * @param {string} data.sessionName - Session name
   * @param {string} [data.userId] - User ID
   * @param {string} [data.externalId] - External ID
   * @param {string} [data.sourceIp] - Source IP
   * @param {string} [data.userAgent] - User agent
   * @param {Date} [data.expiresAt] - Expiration time
   * @param {string} [data.sessionTokenHash] - Session token hash
   * @param {boolean} [data.isActive=true] - Whether session is active
   * @param {string} [data.id] - Session ID (auto-generated if not provided)
   * @param {Date} [data.assumedAt] - Assumption time (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id; // Don't auto-generate if not provided
    this.accountId = data.accountId;
    this.roleId = data.roleId;
    this.userId = data.userId || null;
    this.assumedBy = data.assumedBy; // Who assumed the role
    this.sessionName = data.sessionName;
    this.credentials = data.credentials; // Session credentials
    this.externalId = data.externalId || null;
    this.sourceIp = data.sourceIp || null;
    this.userAgent = data.userAgent || null;
    this.assumedAt = data.assumedAt || new Date();
    this.expiresAt = data.expiresAt; // Don't set default to allow validation
    this.sessionTokenHash = data.sessionTokenHash || (typeof crypto !== 'undefined' ? this.generateTokenHash() : null);
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt; // Don't auto-generate if not provided
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates role session data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.roleId - Role ID
   * @param {string} data.sessionName - Session name
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

    // Validate roleId
    if (!data.roleId) {
      errors.push('Role ID is required');
    } else if (typeof data.roleId !== 'string') {
      errors.push('Role ID must be a string');
    }

    // Validate sessionName
    if (!data.sessionName) {
      errors.push('Session name is required');
    } else if (typeof data.sessionName !== 'string') {
      errors.push('Session name must be a string');
    } else if (data.sessionName.length < 2 || data.sessionName.length > 64) {
      errors.push('Session name must be between 2 and 64 characters');
    } else if (!/^[a-zA-Z0-9+=,.@\-_]+$/.test(data.sessionName)) {
      errors.push('Session name contains invalid characters');
    }

    // Validate optional fields
    if (data.userId && typeof data.userId !== 'string') {
      errors.push('User ID must be a string');
    }

    if (data.externalId && typeof data.externalId !== 'string') {
      errors.push('External ID must be a string');
    }

    if (data.sourceIp && typeof data.sourceIp !== 'string') {
      errors.push('Source IP must be a string');
    }

    if (data.userAgent && typeof data.userAgent !== 'string') {
      errors.push('User agent must be a string');
    }

    if (errors.length > 0) {
      const error = new Error('Role session validation failed');
      error.details = errors;
      throw error;
    }

    return data;
  }

  /**
   * Generates a session token hash
   * @returns {string} Token hash
   */
  generateTokenHash() {
    if (typeof crypto === 'undefined') {
      return null;
    }
    const token = crypto.randomBytes(32).toString('hex');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Checks if the session is expired
   * @returns {boolean} True if expired
   */
  isExpired() {
    return new Date() > this.expiresAt;
  }

  /**
   * Checks if the session is valid (active and not expired)
   * @returns {boolean} True if valid
   */
  isValid() {
    return this.isActive && !this.isExpired();
  }

  /**
   * Deactivates the session
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Extends the session expiration time
   * @param {number} durationSeconds - Additional duration in seconds
   * @param {number} [maxDuration=43200] - Maximum allowed duration (12 hours)
   */
  extend(durationSeconds, maxDuration = 43200) {
    const now = new Date();
    const maxExpiresAt = new Date(this.assumedAt.getTime() + maxDuration * 1000);
    const newExpiresAt = new Date(now.getTime() + durationSeconds * 1000);
    
    // Don't extend beyond the maximum duration from assumption time
    this.expiresAt = newExpiresAt > maxExpiresAt ? maxExpiresAt : newExpiresAt;
    this.updatedAt = new Date();
  }

  /**
   * Gets the remaining session time in seconds
   * @returns {number} Remaining seconds (0 if expired)
   */
  getRemainingTime() {
    const now = new Date();
    const remaining = Math.floor((this.expiresAt - now) / 1000);
    return Math.max(0, remaining);
  }

  /**
   * Gets session duration in seconds
   * @returns {number} Session duration
   */
  getDuration() {
    return Math.floor((this.expiresAt - this.assumedAt) / 1000);
  }

  /**
   * Creates a copy of the session for updating
   * @returns {RoleSession} New RoleSession instance
   */
  clone() {
    return new RoleSession({
      id: this.id,
      accountId: this.accountId,
      roleId: this.roleId,
      userId: this.userId,
      sessionName: this.sessionName,
      externalId: this.externalId,
      sourceIp: this.sourceIp,
      userAgent: this.userAgent,
      assumedAt: this.assumedAt,
      expiresAt: this.expiresAt,
      sessionTokenHash: this.sessionTokenHash,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * Converts the session to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      sessionId: this.id,
      credentials: this.credentials,
      assumedRoleUser: {
        arn: `arn:aws:sts::${this.accountId}:assumed-role/${this.roleId}/${this.sessionName}`,
        assumedRoleId: `${this.roleId}:${this.sessionName}`
      },
      expiration: this.expiresAt ? this.expiresAt.toISOString() : null,
      // Legacy fields for backward compatibility
      id: this.id,
      roleId: this.roleId,
      assumedBy: this.assumedBy || this.userId,
      sessionName: this.sessionName,
      expiresAt: this.expiresAt ? this.expiresAt.toISOString() : null,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null
    };
  }

  /**
   * Creates a RoleSession instance from database row
   * @param {Object} row - Database row
   * @returns {RoleSession} RoleSession instance
   */
  static fromDatabaseRow(row) {
    return new RoleSession({
      id: row.id,
      accountId: row.account_id,
      roleId: row.role_id,
      userId: row.user_id,
      sessionName: row.session_name,
      externalId: row.external_id,
      sourceIp: row.source_ip,
      userAgent: row.user_agent,
      assumedAt: row.assumed_at,
      expiresAt: row.expires_at,
      sessionTokenHash: row.session_token_hash,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Creates a session for role assumption
   * @param {Object} data - Session data
   * @param {string} data.accountId - Account ID
   * @param {string} data.roleId - Role ID
   * @param {string} data.sessionName - Session name
   * @param {string} [data.userId] - User ID
   * @param {number} [data.durationSeconds] - Session duration in seconds
   * @param {string} [data.externalId] - External ID
   * @param {string} [data.sourceIp] - Source IP
   * @param {string} [data.userAgent] - User agent
   * @returns {RoleSession} New session
   */
  static createAssumeRoleSession(data) {
    const duration = data.durationSeconds || 3600; // 1 hour default
    const now = new Date();
    
    return new RoleSession({
      accountId: data.accountId,
      roleId: data.roleId,
      userId: data.userId,
      sessionName: data.sessionName,
      externalId: data.externalId,
      sourceIp: data.sourceIp,
      userAgent: data.userAgent,
      assumedAt: now,
      expiresAt: new Date(now.getTime() + duration * 1000)
    });
  }

  /**
   * Validates this role session instance
   * @throws {Error} If validation fails
   */
  validate() {
    const data = {
      roleId: this.roleId,
      assumedBy: this.assumedBy,
      expiresAt: this.expiresAt,
      sessionName: this.sessionName
    };

    const errors = [];

    // Validate roleId
    if (!data.roleId) {
      errors.push('Role ID is required');
    }

    // Validate assumedBy
    if (!data.assumedBy) {
      errors.push('Assumed by is required');
    }

    // Validate expiresAt
    if (!data.expiresAt) {
      errors.push('Expiration date is required');
    } else if (!(data.expiresAt instanceof Date)) {
      errors.push('Expiration date must be a valid Date');
    }

    // Validate sessionName length
    if (data.sessionName && data.sessionName.length > 64) {
      errors.push('Session name must be 64 characters or less');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }

  /**
   * Get time remaining until session expires
   * @returns {number} Time remaining in milliseconds
   */
  getTimeRemaining() {
    return this.expiresAt.getTime() - Date.now();
  }

  /**
   * Creates a RoleSession from JSON data
   * @param {Object} jsonData - JSON data
   * @returns {RoleSession} RoleSession instance
   */
  static fromJSON(jsonData) {
    const data = { ...jsonData };
    
    // Convert string dates to Date objects
    if (data.expiresAt && typeof data.expiresAt === 'string') {
      data.expiresAt = new Date(data.expiresAt);
    }
    if (data.assumedAt && typeof data.assumedAt === 'string') {
      data.assumedAt = new Date(data.assumedAt);
    }
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    // Create session but preserve original values (don't auto-generate)
    const session = Object.create(RoleSession.prototype);
    session.id = data.id;
    session.accountId = data.accountId;
    session.roleId = data.roleId;
    session.userId = data.userId || null;
    session.assumedBy = data.assumedBy;
    session.sessionName = data.sessionName;
    session.credentials = data.credentials;
    session.externalId = data.externalId || null;
    session.sourceIp = data.sourceIp || null;
    session.userAgent = data.userAgent || null;
    session.assumedAt = data.assumedAt;
    session.expiresAt = data.expiresAt;
    session.sessionTokenHash = data.sessionTokenHash;
    session.isActive = data.isActive !== undefined ? data.isActive : true;
    session.createdAt = data.createdAt;
    session.updatedAt = data.updatedAt;
    
    return session;
  }
}

module.exports = RoleSession;
