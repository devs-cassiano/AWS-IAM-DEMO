const { repositoryFactory } = require('../src/repositories/RepositoryFactory');
const { DefaultRoleService } = require('../src/services/DefaultRoleService');

/**
 * Script to assign root role to existing root users
 */
async function assignRootRoleToExistingUsers() {
  try {
    console.log('🔄 Assigning root role to existing root users...');
    
    // Initialize repository factory
    await repositoryFactory.initialize();
    
    // Create repositories
    const userRepository = repositoryFactory.createUserRepository();
    const roleRepository = repositoryFactory.createRoleRepository();
    const policyRepository = repositoryFactory.createPolicyRepository();
    const userRoleRepository = repositoryFactory.createUserRoleRepository();
    
    // Create DefaultRoleService
    const defaultRoleService = new DefaultRoleService(
      roleRepository,
      policyRepository,
      userRoleRepository
    );
    
    // Find all root users
    const allUsers = await userRepository.findAll();
    const rootUsers = allUsers.filter(user => user.isRoot);
    
    console.log(`📋 Found ${rootUsers.length} root users`);
    
    for (const user of rootUsers) {
      try {
        await defaultRoleService.assignDefaultRoleToUser(user.id, 'root');
        console.log(`✅ Assigned root role to user: ${user.email || user.username}`);
      } catch (error) {
        if (error.message.includes('already has role')) {
          console.log(`ℹ️  User ${user.email || user.username} already has root role`);
        } else {
          console.error(`❌ Failed to assign role to ${user.email || user.username}:`, error.message);
        }
      }
    }
    
    console.log('✅ Finished assigning root roles');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to assign root roles:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run assignment
if (require.main === module) {
  assignRootRoleToExistingUsers();
}

module.exports = { assignRootRoleToExistingUsers };
