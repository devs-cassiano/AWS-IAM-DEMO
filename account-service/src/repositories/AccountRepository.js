const { Account } = require('../models/Account.js');

/**
 * Repository for Account entity
 * Handles database operations for accounts
 */
class AccountRepository {
  /**
   * Creates a new AccountRepository instance
   * @param {Object} db - Database connection instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Creates a new account in the database
   * @param {Account} account - Account instance to create
   * @returns {Promise<Account>} Created account
   * @throws {Error} If database operation fails
   */
  async create(account) {
    try {
      const query = `
        INSERT INTO accounts (id, name, email, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        account.id,
        account.name,
        account.email,
        account.status,
        account.createdAt,
        account.updatedAt
      ];

      const result = await this.db.query(query, values);
      const row = result.rows[0];
      
      return new Account({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds an account by its ID
   * @param {string} id - Account ID
   * @returns {Promise<Account|null>} Account instance or null if not found
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM accounts WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new Account({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds an account by email
   * @param {string} email - Account email
   * @returns {Promise<Account|null>} Account instance or null if not found
   */
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM accounts WHERE email = $1';
      const result = await this.db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return new Account({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Finds all accounts with pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Account[]>} Array of Account instances
   */
  async findAll(options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      const query = `
        SELECT * FROM accounts 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await this.db.query(query, [limit, offset]);
      
      return result.rows.map(row => new Account({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates an account in the database
   * @param {Account} account - Account instance to update
   * @returns {Promise<Account>} Updated account
   */
  async update(account) {
    try {
      const query = `
        UPDATE accounts 
        SET name = $1, email = $2, status = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
      `;
      
      const updatedAt = new Date();
      const values = [
        account.name,
        account.email,
        account.status,
        updatedAt,
        account.id
      ];

      const result = await this.db.query(query, values);
      const row = result.rows[0];
      
      return new Account({
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes an account from the database
   * @param {string} id - Account ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM accounts WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { AccountRepository };
