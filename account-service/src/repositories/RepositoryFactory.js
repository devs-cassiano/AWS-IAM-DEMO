const { databaseConfig } = require('../config/database');

// PostgreSQL repositories (Production-ready)
const { PostgreSQLAccountRepository } = require('./PostgreSQLAccountRepository');
const { PostgreSQLUserRepository } = require('./PostgreSQLUserRepository');
const { PostgreSQLUserRoleRepository } = require('./PostgreSQLUserRoleRepository');
const PostgreSQLGroupRepository = require('./PostgreSQLGroupRepository');
const PostgreSQLPolicyRepository = require('./PostgreSQLPolicyRepository');
const PostgreSQLPolicyAttachmentRepository = require('./PostgreSQLPolicyAttachmentRepository');
const PostgreSQLRoleRepository = require('./PostgreSQLRoleRepository');
const { PostgreSQLPermissionRepository } = require('./PostgreSQLPermissionRepository');

/**
 * Repository Factory
 * Production-ready PostgreSQL implementation only
 * All repositories instantiate PostgreSQL implementations
 */
class RepositoryFactory {
  constructor() {
    this.validateDatabaseConfiguration();
  }

  /**
   * Validate that database configuration is available
   */
  validateDatabaseConfiguration() {
    const hasDbConfig = process.env.DATABASE_HOST || 
                       process.env.DATABASE_URL || 
                       process.env.DATABASE_NAME;
    
    if (!hasDbConfig && process.env.NODE_ENV !== 'test') {
      throw new Error(
        '❌ Database configuration required for production. ' +
        'Please set DATABASE_HOST, DATABASE_URL, or DATABASE_NAME environment variables.'
      );
    }
    
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🐘 Database: PostgreSQL configured');
  }

  /**
   * Get Account Repository instance
   */
  createAccountRepository() {
    console.log('🐘 Using PostgreSQL Account Repository');
    return new PostgreSQLAccountRepository();
  }

  /**
   * Get User Repository instance
   */
  createUserRepository() {
    console.log('🐘 Using PostgreSQL User Repository');
    return new PostgreSQLUserRepository();
  }

  /**
   * Get Group Repository instance
   */
  createGroupRepository() {
    console.log('🐘 Using PostgreSQL Group Repository');
    return new PostgreSQLGroupRepository(databaseConfig.pool);
  }

  /**
   * Get Policy Repository instance
   */
  createPolicyRepository() {
    console.log('🐘 Using PostgreSQL Policy Repository');
    return new PostgreSQLPolicyRepository(databaseConfig.pool);
  }

  /**
   * Get Policy Attachment Repository instance
   */
  createPolicyAttachmentRepository() {
    console.log('🐘 Using PostgreSQL Policy Attachment Repository');
    return new PostgreSQLPolicyAttachmentRepository(databaseConfig.pool);
  }

  /**
   * Get Role Repository instance
   */
  createRoleRepository() {
    console.log('🐘 Using PostgreSQL Role Repository');
    return new PostgreSQLRoleRepository(databaseConfig.pool);
  }

  /**
   * Get User Role Repository instance
   */
  createUserRoleRepository() {
    console.log('🐘 Using PostgreSQL User Role Repository');
    return new PostgreSQLUserRoleRepository(databaseConfig.pool);
  }

  /**
   * Get Permission Repository instance
   */
  createPermissionRepository() {
    console.log('🐘 Using PostgreSQL Permission Repository');
    return new PostgreSQLPermissionRepository(databaseConfig.pool);
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      await databaseConfig.connect();
      console.log('✅ Database factory initialized with PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error.message);
      throw error;
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    return await databaseConfig.healthCheck();
  }

  /**
   * Get database type for debugging
   */
  getDatabaseType() {
    return 'postgresql';
  }

  /**
   * Get database pool for advanced operations
   */
  get pool() {
    return databaseConfig.pool;
  }

  /**
   * Close database connections
   */
  async close() {
    await databaseConfig.disconnect();
  }
}

// Singleton instance
const repositoryFactory = new RepositoryFactory();

module.exports = { 
  RepositoryFactory, 
  repositoryFactory 
};
