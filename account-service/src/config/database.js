const { Pool } = require('pg');
require('dotenv').config();

/**
 * Database configuration and connection management
 */
class DatabaseConfig {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Get database configuration from environment variables
   */
  getConfig() {
    const isTest = process.env.NODE_ENV === 'test';
    
    return {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: isTest 
        ? (process.env.TEST_DATABASE_NAME || 'iam_platform_test')
        : (process.env.DATABASE_NAME || 'iam_platform'),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'password',
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      
      // Connection pool settings
      min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
      max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  /**
   * Initialize database connection pool
   */
  async connect() {
    if (this.isConnected) {
      return this.pool;
    }

    try {
      const config = this.getConfig();
      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log(`✅ Database connected: ${config.database}@${config.host}:${config.port}`);
      
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get connection pool instance
   */
  getPool() {
    if (!this.isConnected || !this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  /**
   * Execute query with automatic connection management
   */
  async query(text, params = []) {
    const pool = this.getPool();
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Query executed in ${duration}ms:`, text.substring(0, 50) + '...');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      console.error('Query:', text);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Execute queries within a transaction
   */
  async withTransaction(callback) {
    const client = await this.beginTransaction();
    
    try {
      const result = await callback(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('✅ Database connections closed');
    }
  }

  /**
   * Check if database is healthy
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = { DatabaseConfig, databaseConfig };
