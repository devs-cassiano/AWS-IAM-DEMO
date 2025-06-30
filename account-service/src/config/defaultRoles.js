/**
 * Default system roles configuration
 * These roles are automatically created and managed by the system
 */

const DEFAULT_ROLES = {
  ROOT: {
    name: 'root',
    description: 'Full system administrator role with unrestricted access to all resources',
    type: 'system',
    policies: [
      {
        name: 'RootFullAccessPolicy',
        description: 'Grants full access to all AWS services and resources',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: '*',
              Resource: '*'
            }
          ]
        }
      }
    ]
  },
  
  IAM_USER: {
    name: 'iam-user',
    description: 'Default role for IAM users with basic permissions',
    type: 'system',
    policies: [
      {
        name: 'IAMUserBasicPolicy',
        description: 'Basic permissions for IAM users',
        document: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:GetUser',
                'iam:ChangePassword',
                'iam:GetAccountSummary'
              ],
              Resource: '*'
            }
          ]
        }
      }
    ]
  }
};

/**
 * Get default role configuration by role name
 * @param {string} roleName - Name of the role to get
 * @returns {Object|null} Role configuration or null if not found
 */
function getDefaultRole(roleName) {
  const roleKey = Object.keys(DEFAULT_ROLES).find(
    key => DEFAULT_ROLES[key].name === roleName
  );
  return roleKey ? DEFAULT_ROLES[roleKey] : null;
}

/**
 * Get all default roles
 * @returns {Object} All default roles configuration
 */
function getAllDefaultRoles() {
  return DEFAULT_ROLES;
}

/**
 * Check if a role is a system default role
 * @param {string} roleName - Name of the role to check
 * @returns {boolean} True if role is a system default role
 */
function isSystemRole(roleName) {
  return Object.values(DEFAULT_ROLES).some(role => role.name === roleName);
}

module.exports = {
  DEFAULT_ROLES,
  getDefaultRole,
  getAllDefaultRoles,
  isSystemRole
};
