const { repositoryFactory } = require('../src/repositories/RepositoryFactory');
const { DefaultRoleService } = require('../src/services/DefaultRoleService');

/**
 * Script to initialize default system roles
 * Run this after setting up the database to create system roles and policies
 */
async function initializeSystemRoles() {
  try {
    console.log('🔄 Initializing system roles...');
    
    // Initialize repository factory
    await repositoryFactory.initialize();
    
    // Create repositories
    const roleRepository = repositoryFactory.createRoleRepository();
    const policyRepository = repositoryFactory.createPolicyRepository();
    const userRoleRepository = repositoryFactory.createUserRoleRepository();
    
    // Create DefaultRoleService
    const defaultRoleService = new DefaultRoleService(
      roleRepository,
      policyRepository,
      userRoleRepository
    );
    
    // Initialize default roles
    const createdRoles = await defaultRoleService.initializeDefaultRoles();
    
    console.log('✅ System roles initialized successfully!');
    console.log(`📋 Created ${createdRoles.length} system roles:`);
    
    for (const role of createdRoles) {
      console.log(`   - ${role.name}: ${role.description}`);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Create user accounts - root users will automatically get the "root" role');
    console.log('   2. IAM users will automatically get the "iam-user" role');
    console.log('   3. Root role users have full access to all resources');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize system roles:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeSystemRoles();
}

module.exports = { initializeSystemRoles };
