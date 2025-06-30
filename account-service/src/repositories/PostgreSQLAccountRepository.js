const { databaseConfig } = require('../config/database');
const { Account } = require('../models/Account');

/**
 * PostgreSQL Account Repository
 * Implements account data access using PostgreSQL
 */
class PostgreSQLAccountRepository {
  constructor() {
    this.tableName = 'accounts';
  }

  /**
   * Create a new account
   */
  async create(account) {
    const query = `
      INSERT INTO ${this.tableName} (id, name, email, status, created_at, updated_at)
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
    
    const result = await databaseConfig.query(query, values);
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Create a new account within a transaction
   */
  async createWithTransaction(account, transaction) {
    const query = `
      INSERT INTO ${this.tableName} (id, name, email, status, created_at, updated_at)
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
    
    const result = await transaction.query(query, values);
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Find account by ID
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await databaseConfig.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Find account by email
   */
  async findByEmail(email) {
    const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
    const result = await databaseConfig.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Find all accounts with pagination
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;
    
    let query = `SELECT * FROM ${this.tableName}`;
    let values = [];
    
    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);
    
    const result = await databaseConfig.query(query, values);
    return result.rows.map(row => this.mapRowToAccount(row));
  }

  /**
   * Update account
   */
  async update(id, updates) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    values.push(id); // ID parameter for WHERE clause
    
    const query = `
      UPDATE ${this.tableName} 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await databaseConfig.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToAccount(result.rows[0]);
  }

  /**
   * Delete account
   */
  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await databaseConfig.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get total count of accounts
   */
  async getCount(status = null) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values = [];
    
    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }
    
    const result = await databaseConfig.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Map database row to Account object
   */
  mapRowToAccount(row) {
    return new Account({
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Health check for database connection
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

module.exports = { PostgreSQLAccountRepository };
