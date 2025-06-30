#!/usr/bin/env node

/**
 * Database migration CLI tool
 * Usage:
 *   node scripts/migrate.js run      - Run pending migrations
 *   node scripts/migrate.js status   - Show migration status
 *   node scripts/migrate.js reset    - Reset database (dev/test only)
 */

const { MigrationRunner } = require('../src/utils/MigrationRunner');
const { databaseConfig } = require('../src/config/database');

async function main() {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();

  try {
    switch (command) {
      case 'run':
        await migrationRunner.runMigrations();
        break;
        
      case 'status':
        await migrationRunner.getMigrationStatus();
        break;
        
      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Cannot reset database in production');
          process.exit(1);
        }
        await migrationRunner.resetDatabase();
        console.log('✅ Database reset completed');
        break;
        
      default:
        console.log('Database Migration Tool');
        console.log('=======================');
        console.log('Usage:');
        console.log('  node scripts/migrate.js run      - Run pending migrations');
        console.log('  node scripts/migrate.js status   - Show migration status');
        console.log('  node scripts/migrate.js reset    - Reset database (dev/test only)');
        break;
    }
  } catch (error) {
    console.error('❌ Migration command failed:', error.message);
    process.exit(1);
  } finally {
    await databaseConfig.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
