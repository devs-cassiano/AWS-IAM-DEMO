const { User } = require('../models/User');

/**
 * UserRepository class for managing user data persistence
 * Handles CRUD operations for users in the database
 */
class UserRepository {
  /**
   * Creates a new UserRepository instance
   * @param {Object} db - Database connection instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Creates a new user in the database
   * @param {User} user - User instance to create
   * @returns {Promise<User>} Created user instance
   * @throws {Error} If database operation fails
   */
  async create(user) {
    try {
      const query = `
        INSERT INTO users (id, account_id, username, email, password_hash, is_root, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const values = [
        user.id,
        user.accountId,
        user.username,
        user.email,
        user.passwordHash,
        user.isRoot,
        user.status,
        user.createdAt,
        user.updatedAt
      ];

      const result = await this.db.query(query, values);
      const row = result.rows[0];
      
      return new User({
        id: row.id,
        accountId: row.account_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        isRoot: row.is_root,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds a user by its ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User instance or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new User({
        id: row.id,
        accountId: row.account_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        isRoot: row.is_root,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds a user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User instance or null if not found
   * @throws {Error} If database operation fails
   */
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new User({
        id: row.id,
        accountId: row.account_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        isRoot: row.is_root,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds all users for a specific account
   * @param {string} accountId - Account ID
   * @returns {Promise<User[]>} Array of User instances
   * @throws {Error} If database operation fails
   */
  async findByAccountId(accountId) {
    try {
      const query = 'SELECT * FROM users WHERE account_id = $1 ORDER BY created_at DESC';
      const result = await this.db.query(query, [accountId]);
      
      return result.rows.map(row => new User({
        id: row.id,
        accountId: row.account_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        isRoot: row.is_root,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates an existing user
   * @param {User} user - User instance with updated data
   * @returns {Promise<User|null>} Updated user instance or null if not found
   * @throws {Error} If database operation fails
   */
  async update(user) {
    try {
      const query = `
        UPDATE users 
        SET username = $1, email = $2, password_hash = $3, status = $4, updated_at = $5
        WHERE id = $6
        RETURNING *
      `;
      
      const values = [
        user.username,
        user.email,
        user.passwordHash,
        user.status,
        user.updatedAt,
        user.id
      ];

      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new User({
        id: row.id,
        accountId: row.account_id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        isRoot: row.is_root,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a user by ID
   * @param {string} id - User ID to delete
   * @returns {Promise<boolean>} True if deleted successfully, false if not found
   * @throws {Error} If database operation fails
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { UserRepository };
