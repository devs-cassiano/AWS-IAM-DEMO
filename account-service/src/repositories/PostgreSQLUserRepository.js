const { databaseConfig } = require('../config/database');
const { User } = require('../models/User');

/**
 * PostgreSQL User Repository
 * Implements user data access using PostgreSQL
 */
class PostgreSQLUserRepository {
  constructor() {
    this.tableName = 'users';
  }

  /**
   * Maps database row to User object
   * @param {Object} row - Database row
   * @returns {User|null} User instance or null
   */
  mapRowToUser(row) {
    if (!row) return null;
    
    return new User({
      id: row.id,
      accountId: row.account_id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      isRoot: row.is_root || false,
      firstName: row.first_name || null,
      lastName: row.last_name || null,
      status: row.status || 'active',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Create a new user
   * @param {User} user - User instance to create
   * @returns {Promise<User>} Created user
   */
  async create(user) {
    const query = `
      INSERT INTO ${this.tableName} (id, account_id, username, email, password_hash, is_root, first_name, last_name, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      user.id,
      user.accountId,
      user.username,
      user.isRoot ? user.email : null, // IAM users don't have email
      user.passwordHash,
      user.isRoot || false,
      user.isRoot ? (user.firstName || null) : null, // Only root users have firstName
      user.isRoot ? (user.lastName || null) : null,  // Only root users have lastName
      user.status || 'active',
      user.createdAt || new Date(),
      user.updatedAt || new Date()
    ];
    
    const result = await databaseConfig.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Create a new user within a transaction
   * @param {User} user - User instance to create
   * @param {Object} transaction - Database transaction object
   * @returns {Promise<User>} Created user
   */
  async createWithTransaction(user, transaction) {
    const query = `
      INSERT INTO ${this.tableName} (id, account_id, username, email, password_hash, is_root, first_name, last_name, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      user.id,
      user.accountId,
      user.username,
      user.isRoot ? user.email : null, // IAM users don't have email
      user.passwordHash,
      user.isRoot || false,
      user.isRoot ? (user.firstName || null) : null, // Only root users have firstName
      user.isRoot ? (user.lastName || null) : null,  // Only root users have lastName
      user.status || 'active',
      user.createdAt || new Date(),
      user.updatedAt || new Date()
    ];
    
    const result = await transaction.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} updates - Update data
   * @returns {Promise<User|null>} Updated user or null
   */
  async update(userId, updates) {
    // First get the current user to check if it's root
    const currentUser = await this.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic update query
    if (updates.username !== undefined) {
      setClause.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    
    // Email can only be updated for root users, and IAM users should never have email
    if (updates.email !== undefined) {
      if (currentUser.isRoot) {
        setClause.push(`email = $${paramIndex++}`);
        values.push(updates.email);
      }
      // For IAM users, ignore email updates - they should always be null
    }
    
    if (updates.passwordHash !== undefined) {
      setClause.push(`password_hash = $${paramIndex++}`);
      values.push(updates.passwordHash);
    }
    if (updates.status !== undefined) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    
    // firstName and lastName only for root users
    if (updates.firstName !== undefined && currentUser.isRoot) {
      setClause.push(`first_name = $${paramIndex++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined && currentUser.isRoot) {
      setClause.push(`last_name = $${paramIndex++}`);
      values.push(updates.lastName);
    }

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Always update the updated_at timestamp
    setClause.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE ${this.tableName} 
      SET ${setClause.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await databaseConfig.query(query, values);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User|null>} User or null
   */
  async findById(userId) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await databaseConfig.query(query, [userId]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User or null
   */
  async findByEmail(email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await databaseConfig.query(query, [email]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find user by username and account ID
   * @param {string} username - Username
   * @param {string} accountId - Account ID
   * @returns {Promise<User|null>} User or null
   */
  async findByUsernameAndAccount(username, accountId) {
    const query = `SELECT * FROM ${this.tableName} WHERE username = $1 AND account_id = $2`;
    const result = await databaseConfig.query(query, [username, accountId]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Find all users by account ID
   * @param {string} accountId - Account ID
   * @returns {Promise<User[]>} Array of users
   */
  async findByAccountId(accountId) {
    const query = `SELECT * FROM ${this.tableName} WHERE account_id = $1 ORDER BY created_at ASC`;
    const result = await databaseConfig.query(query, [accountId]);
    return result.rows.map(row => this.mapRowToUser(row));
  }

  /**
   * Find all users
   * @returns {Promise<User[]>} Array of all users
   */
  async findAll() {
    const query = `SELECT * FROM ${this.tableName} ORDER BY created_at ASC`;
    const result = await databaseConfig.query(query);
    return result.rows.map(row => this.mapRowToUser(row));
  }

  /**
   * Delete user by ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if deleted, false otherwise
   */
  async delete(userId) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await databaseConfig.query(query, [userId]);
    return result.rowCount > 0;
  }

  /**
   * Find root user by account ID
   * @param {string} accountId - Account ID
   * @returns {Promise<User|null>} Root user or null
   */
  async findRootByAccountId(accountId) {
    const query = `SELECT * FROM ${this.tableName} WHERE account_id = $1 AND is_root = true`;
    const result = await databaseConfig.query(query, [accountId]);
    return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
  }

  /**
   * Health check for database connection
   * @returns {Promise<boolean>} True if healthy, false otherwise
   */
  async healthCheck() {
    try {
      const result = await databaseConfig.query('SELECT 1');
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = { PostgreSQLUserRepository };
