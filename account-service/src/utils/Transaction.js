const { databaseConfig } = require('../config/database');

/**
 * Transaction Manager for PostgreSQL
 * Provides transaction support for critical operations
 */
class Transaction {
  constructor() {
    this.client = null;
    this.isActive = false;
  }

  /**
   * Start a new transaction
   */
  async begin() {
    if (this.isActive) {
      throw new Error('Transaction already active');
    }

    this.client = await databaseConfig.pool.connect();
    await this.client.query('BEGIN');
    this.isActive = true;
    
    console.log('🔄 Transaction started');
  }

  /**
   * Execute a query within the transaction
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   */
  async query(query, params = []) {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    const startTime = Date.now();
    const result = await this.client.query(query, params);
    const duration = Date.now() - startTime;
    
    console.log(`🔍 Transaction query executed in ${duration}ms: ${query.substring(0, 50)}...`);
    return result;
  }

  /**
   * Commit the transaction
   */
  async commit() {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    try {
      await this.client.query('COMMIT');
      console.log('✅ Transaction committed');
    } finally {
      this.client.release();
      this.client = null;
      this.isActive = false;
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback() {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    try {
      await this.client.query('ROLLBACK');
      console.log('⏪ Transaction rolled back');
    } finally {
      this.client.release();
      this.client = null;
      this.isActive = false;
    }
  }

  /**
   * Execute multiple operations in a transaction
   * @param {Function} operations - Async function containing operations
   */
  static async execute(operations) {
    const transaction = new Transaction();
    
    try {
      await transaction.begin();
      const result = await operations(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = { Transaction };
