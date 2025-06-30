const { getDefaultRole, getAllDefaultRoles, isSystemRole } = require('../config/defaultRoles');
const Policy = require('../models/Policy');
const Role = require('../models/Role');
const { v4: uuidv4 } = require('uuid');

/**
 * Service for managing system default roles
 * Handles creation and assignment of default roles like 'root', 'iam-user', etc.
 */
class DefaultRoleService {
  constructor(roleRepository, policyRepository, userRoleRepository) {
    this.roleRepository = roleRepository;
    this.policyRepository = policyRepository;
    this.userRoleRepository = userRoleRepository;
  }

  /**
   * Initialize all default system roles and policies
   * This should be called during system startup or account creation
   */
  async initializeDefaultRoles() {
    const roles = getAllDefaultRoles();
    const createdRoles = [];

    for (const [key, roleConfig] of Object.entries(roles)) {
      try {
        // Check if role already exists
        const existingRole = await this.roleRepository.findByName(roleConfig.name, null);
        
        if (!existingRole) {
          // Create policies first
          const createdPolicies = [];
          for (const policyConfig of roleConfig.policies) {
            const existingPolicy = await this.policyRepository.findByName(policyConfig.name, null);
            
            if (!existingPolicy) {
              const policyObj = new Policy({
                id: uuidv4(),
                accountId: null, // System policies don't belong to a specific account
                name: policyConfig.name,
                description: policyConfig.description,
                document: policyConfig.document,
                type: 'System',
                path: '/'
              });
              
              const policy = await this.policyRepository.create(policyObj);
              createdPolicies.push(policy);
              console.log(`✅ Created system policy: ${policyConfig.name}`);
            } else {
              createdPolicies.push(existingPolicy);
            }
          }

          // Create role
          const roleObj = new Role({
            id: uuidv4(),
            accountId: null, // System roles don't belong to a specific account
            name: roleConfig.name,
            description: roleConfig.description,
            type: roleConfig.type,
            path: '/',
            assumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'iam.amazonaws.com'
                  },
                  Action: 'sts:AssumeRole'
                }
              ]
            }
          });
          
          const role = await this.roleRepository.create(roleObj);

          // Attach policies to role
          for (const policy of createdPolicies) {
            await this.roleRepository.attachPolicy(role.id, policy.id, null);
          }

          createdRoles.push(role);
          console.log(`✅ Created system role: ${roleConfig.name} with ${createdPolicies.length} policies`);
        } else {
          createdRoles.push(existingRole);
          console.log(`ℹ️  System role already exists: ${roleConfig.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create system role ${roleConfig.name}:`, error.message);
        throw error;
      }
    }

    return createdRoles;
  }

  /**
   * Assign default role to user based on user type
   * @param {string} userId - User ID
   * @param {string} userType - User type ('root' or 'iam')
   */
  async assignDefaultRoleToUser(userId, userType) {
    try {
      let roleName;
      
      if (userType === 'root') {
        roleName = 'root';
      } else if (userType === 'iam') {
        roleName = 'iam-user';
      } else {
        throw new Error(`Unknown user type: ${userType}`);
      }

      // Find the system role
      const role = await this.roleRepository.findByName(roleName, null);
      if (!role) {
        throw new Error(`System role '${roleName}' not found. Please initialize default roles first.`);
      }

      // Check if user already has this role
      const existingAssignment = await this.userRoleRepository.findByUserAndRole(userId, role.id);
      if (existingAssignment) {
        console.log(`ℹ️  User ${userId} already has role ${roleName}`);
        return existingAssignment;
      }

      // Assign role to user
      const assignment = await this.userRoleRepository.create({
        userId: userId,
        roleId: role.id,
        assignedBy: 'system',
        assignedAt: new Date()
      });

      console.log(`✅ Assigned system role '${roleName}' to user ${userId}`);
      return assignment;

    } catch (error) {
      console.error(`❌ Failed to assign default role to user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get default role for user type
   * @param {string} userType - User type ('root' or 'iam')
   * @returns {Object|null} Default role configuration
   */
  getDefaultRoleForUserType(userType) {
    if (userType === 'root') {
      return getDefaultRole('root');
    } else if (userType === 'iam') {
      return getDefaultRole('iam-user');
    }
    return null;
  }

  /**
   * Check if a role is a system default role
   * @param {string} roleName - Name of the role
   * @returns {boolean} True if role is a system role
   */
  isSystemRole(roleName) {
    return isSystemRole(roleName);
  }

  /**
   * Ensure default roles exist and are up to date
   * This can be called periodically to maintain system roles
   */
  async ensureDefaultRoles() {
    console.log('🔄 Ensuring default system roles exist...');
    await this.initializeDefaultRoles();
    console.log('✅ Default system roles verified');
  }
}

module.exports = { DefaultRoleService };
