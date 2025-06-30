const fs = require('fs').promises;
const path = require('path');
const { databaseConfig } = require('../config/database');

/**
 * Database migration system
 * Handles running SQL migration files in order
 */
class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../../migrations');
    this.migrationsTable = 'schema_migrations';
  }

  /**
   * Initialize migrations table to track what's been run
   */
  async initializeMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await databaseConfig.query(query);
    console.log('✅ Migrations table initialized');
  }

  /**
   * Get list of migration files from migrations directory
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Important: run migrations in alphabetical order
    } catch (error) {
      console.error('❌ Error reading migrations directory:', error.message);
      return [];
    }
  }

  /**
   * Get list of already executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await databaseConfig.query(
        `SELECT filename FROM ${this.migrationsTable} ORDER BY id`
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Read and execute a migration file
   */
  async executeMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    
    try {
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Execute migration within a transaction
      await databaseConfig.withTransaction(async (client) => {
        await client.query(sql);
        await client.query(
          `INSERT INTO ${this.migrationsTable} (filename) VALUES ($1)`,
          [filename]
        );
      });
      
      console.log(`✅ Migration executed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error.message);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      
      // Ensure database is connected
      await databaseConfig.connect();
      
      // Initialize migrations tracking table
      await this.initializeMigrationsTable();
      
      // Get migration files and executed migrations
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(file => console.log(`  - ${file}`));
      
      // Execute pending migrations
      for (const filename of pendingMigrations) {
        await this.executeMigration(filename);
      }
      
      console.log('🎉 All migrations completed successfully');
      
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset database (DROP all tables) - Use with caution!
   */
  async resetDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset database in production environment');
    }
    
    try {
      console.log('🧹 Resetting database...');
      
      // Drop all tables
      await databaseConfig.query(`
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS accounts CASCADE;
        DROP TABLE IF EXISTS ${this.migrationsTable} CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      `);
      
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      await databaseConfig.connect();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      console.log('\n📊 Migration Status:');
      console.log('===================');
      
      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅ EXECUTED' : '⏳ PENDING';
        console.log(`${status} ${file}`);
      });
      
      const pendingCount = migrationFiles.length - executedMigrations.length;
      console.log(`\n📋 Total: ${migrationFiles.length} migrations, ${pendingCount} pending\n`);
      
    } catch (error) {
      console.error('❌ Error getting migration status:', error.message);
      throw error;
    }
  }
}

module.exports = { MigrationRunner };
