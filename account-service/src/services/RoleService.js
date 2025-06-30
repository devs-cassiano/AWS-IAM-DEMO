const { RepositoryFactory } = require('../repositories/RepositoryFactory');
const crypto = require('crypto');
const Policy = require('../models/Policy');
const RoleSession = require('../models/RoleSession');

class RoleService {
  constructor(roleRepository = null, policyAttachmentRepository = null) {
    if (roleRepository && policyAttachmentRepository) {
      // Use provided repositories (for testing)
      this.roleRepository = roleRepository;
      this.policyAttachmentRepository = policyAttachmentRepository;
    } else {
      // Use factory for production
      this.repositoryFactory = new RepositoryFactory();
      this.roleRepository = this.repositoryFactory.createRoleRepository();
      this.policyRepository = this.repositoryFactory.createPolicyRepository();
      this.policyAttachmentRepository = this.repositoryFactory.createPolicyAttachmentRepository();
    }
  }

  async createRole(roleData) {
    // Validate required fields
    if (!roleData.name || !roleData.accountId) {
      throw new Error('Role name and account ID are required');
    }

    // Validate assume role policy document
    if (!roleData.assumeRolePolicyDocument) {
      throw new Error('Assume role policy document is required');
    }

    // Check if role with same name already exists in this account
    const existingRole = await this.roleRepository.findByName(roleData.name, roleData.accountId);
    if (existingRole) {
      throw new Error('Role name already exists');
    }

    // Create role object
    const role = {
      id: roleData.id || crypto.randomUUID(),
      accountId: roleData.accountId,
      name: roleData.name,
      description: roleData.description || null,
      assumeRolePolicyDocument: roleData.assumeRolePolicyDocument,
      maxSessionDuration: roleData.maxSessionDuration || 3600,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.roleRepository.create(role);
  }  async getRoleById(roleId, accountId = null) {
    const role = await this.roleRepository.findById(roleId);
    
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Validate account ownership if accountId is provided
    if (accountId && role.accountId !== accountId) {
      throw new Error('Role not found');
    }

    return role;
  }

  async getRolesByAccountId(accountId) {
    return await this.roleRepository.findByAccountId(accountId);
  }

  async updateRole(roleId, updates, accountId = null) {
    const existingRole = await this.roleRepository.findById(roleId);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Validate account ownership if accountId is provided
    if (accountId && existingRole.accountId !== accountId) {
      throw new Error('Role not found');
    }

    // If name is being updated, check for conflicts
    if (updates.name && updates.name !== existingRole.name) {
      const conflictingRole = await this.roleRepository.findByName(updates.name, existingRole.accountId);
      if (conflictingRole && conflictingRole.id !== roleId) {
        throw new Error('Role with this name already exists in this account');
      }
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };

    return await this.roleRepository.update(roleId, updatedData);
  }

  async deleteRole(roleId, accountId) {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    if (role.accountId !== accountId) {
      throw new Error('Role not found in specified account');
    }

    // TODO: Add check for attached policies and active sessions
    await this.roleRepository.delete(roleId, accountId);
    return true;
  }

  async attachPolicy(roleId, policyIdentifier) {
    // Verify role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Try to find policy by ID first, then by name if it's not a UUID
    let policy = null;
    
    // Check if it looks like a UUID
    if (policyIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      policy = await this.policyRepository.findById(policyIdentifier, role.accountId);
    } else if (policyIdentifier.includes('arn:aws:iam::')) {
      // Extract policy name from ARN: arn:aws:iam::123456789012:policy/PolicyName
      const policyName = policyIdentifier.split('/').pop();
      policy = await this.policyRepository.findByName(policyName, role.accountId);
    } else {
      // Assume it's a policy name
      policy = await this.policyRepository.findByName(policyIdentifier, role.accountId);
    }
    
    if (!policy) {
      throw new Error(`Policy not found: ${policyIdentifier}`);
    }

    // Create policy attachment
    const attachment = {
      id: crypto.randomUUID(),
      roleId: roleId,
      policyId: policy.id,
      attachedAt: new Date()
    };

    return await this.policyAttachmentRepository.create(attachment);
  }

  async detachPolicy(roleId, policyIdentifier) {
    // Verify role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Try to find policy by ID first, then by name if it's not a UUID
    let policy = null;
    
    // Check if it looks like a UUID
    if (policyIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      policy = await this.policyRepository.findById(policyIdentifier, role.accountId);
    } else if (policyIdentifier.includes('arn:aws:iam::')) {
      // Extract policy name from ARN: arn:aws:iam::123456789012:policy/PolicyName
      const policyName = policyIdentifier.split('/').pop();
      policy = await this.policyRepository.findByName(policyName, role.accountId);
    } else {
      // Assume it's a policy name
      policy = await this.policyRepository.findByName(policyIdentifier, role.accountId);
    }
    
    if (!policy) {
      throw new Error(`Policy not found: ${policyIdentifier}`);
    }

    // Use the specific detachPolicyFromRole method
    const success = await this.policyAttachmentRepository.detachPolicyFromRole(policy.id, roleId, role.accountId);
    
    if (!success) {
      throw new Error('Policy not attached to this role');
    }

    return true;
  }

  async getRolePolicies(roleId, accountId) {
    // Verify role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    // Verify account access
    if (role.accountId !== accountId) {
      const error = new Error('Role not found');
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    // Get all policies attached to this role
    const query = `
      SELECT p.* 
      FROM policies p
      INNER JOIN role_policies rp ON p.id = rp.policy_id
      WHERE rp.role_id = $1 AND rp.account_id = $2
      ORDER BY p.name
    `;

    const result = await this.roleRepository.pool.query(query, [roleId, accountId]);
    
    // Convert to Policy objects
    return result.rows.map(row => Policy.fromDatabaseRow(row));
  }

  async getActiveRoleSessions(roleId, accountId) {
    // Verify role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      const error = new Error('Role not found');
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    // Verify account access
    if (role.accountId !== accountId) {
      const error = new Error('Role not found');
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    // Get active sessions for this role
    const query = `
      SELECT * 
      FROM role_sessions 
      WHERE role_id = $1 AND account_id = $2 AND is_active = true AND expires_at > NOW()
      ORDER BY created_at DESC
    `;

    const result = await this.roleRepository.pool.query(query, [roleId, accountId]);
    
    // Convert to RoleSession objects
    return result.rows.map(row => RoleSession.fromDatabaseRow(row));
  }

  async assumeRole(roleId, userId, sessionName, durationSeconds = 3600) {
    // Verify role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Validate session duration
    if (durationSeconds > role.maxSessionDuration) {
      throw new Error(`Session duration cannot exceed ${role.maxSessionDuration} seconds`);
    }

    // Generate temporary credentials (AWS STS style)
    const tempCredentials = {
      accessKeyId: `ASIA${crypto.randomBytes(12).toString('hex').toUpperCase()}`,
      secretAccessKey: crypto.randomBytes(20).toString('hex'),
      sessionToken: crypto.randomBytes(32).toString('hex')
    };

    // Create role session with full database format
    const session = {
      id: crypto.randomUUID(),
      accountId: role.accountId,
      roleId: roleId,
      userId: userId,
      sessionName: sessionName || 'RoleSession',
      externalId: null,
      sourceIp: null,
      userAgent: null,
      assumedAt: new Date(),
      expiresAt: new Date(Date.now() + (durationSeconds * 1000)),
      sessionTokenHash: crypto.createHash('sha256').update(tempCredentials.sessionToken).digest('hex'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add temporary credentials for the response
      credentials: tempCredentials
    };

    const createdSession = await this.roleRepository.createSession(session);
    
    // Add credentials to the returned session for the API response
    createdSession.credentials = tempCredentials;
    
    return createdSession;
  }

  async getRoleSession(sessionId) {
    const session = await this.roleRepository.findSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new Error('Session has expired');
    }

    return session;
  }

  async cleanupExpiredSessions() {
    return await this.roleRepository.cleanupExpiredSessions();
  }

  async validateTrustPolicy(trustPolicy, principal) {
    // Basic trust policy validation
    if (!trustPolicy) {
      return true; // No trust policy means allow all
    }

    try {
      const policy = typeof trustPolicy === 'string' ? JSON.parse(trustPolicy) : trustPolicy;
      
      if (!policy.Statement || !Array.isArray(policy.Statement)) {
        return false;
      }

      // Check if any statement allows the principal
      for (const statement of policy.Statement) {
        if (statement.Effect === 'Allow' && this.matchesPrincipal(statement.Principal, principal)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error validating trust policy:', error);
      return false;
    }
  }

  matchesPrincipal(policyPrincipal, actualPrincipal) {
    if (policyPrincipal === '*') {
      return true;
    }

    if (typeof policyPrincipal === 'string') {
      return policyPrincipal === actualPrincipal;
    }

    if (Array.isArray(policyPrincipal)) {
      return policyPrincipal.includes(actualPrincipal);
    }

    // Handle AWS service principals
    if (policyPrincipal.Service) {
      if (Array.isArray(policyPrincipal.Service)) {
        return policyPrincipal.Service.includes(actualPrincipal);
      }
      return policyPrincipal.Service === actualPrincipal;
    }

    if (policyPrincipal.AWS) {
      if (Array.isArray(policyPrincipal.AWS)) {
        return policyPrincipal.AWS.includes(actualPrincipal);
      }
      return policyPrincipal.AWS === actualPrincipal;
    }

    return false;
  }

  async validateAssumeRolePolicyDocument(policyDocument) {
    const errors = [];
    
    try {
      // Parse if it's a string
      const policy = typeof policyDocument === 'string' ? JSON.parse(policyDocument) : policyDocument;
      
      // Validate required structure
      if (!policy.Version) {
        errors.push('Policy must have a Version field');
      } else if (policy.Version !== '2012-10-17') {
        errors.push('Policy Version must be "2012-10-17"');
      }
      
      if (!policy.Statement) {
        errors.push('Policy must have a Statement field');
      } else if (!Array.isArray(policy.Statement)) {
        errors.push('Statement must be an array');
      } else {
        // Validate each statement
        policy.Statement.forEach((statement, index) => {
          if (!statement.Effect) {
            errors.push(`Statement ${index + 1} must have an Effect field`);
          } else if (!['Allow', 'Deny'].includes(statement.Effect)) {
            errors.push(`Statement ${index + 1} Effect must be "Allow" or "Deny"`);
          }
          
          if (!statement.Principal) {
            errors.push(`Statement ${index + 1} must have a Principal field`);
          }
          
          if (!statement.Action) {
            errors.push(`Statement ${index + 1} must have an Action field`);
          } else if (typeof statement.Action === 'string') {
            if (statement.Action !== 'sts:AssumeRole') {
              errors.push(`Statement ${index + 1} Action should be "sts:AssumeRole"`);
            }
          } else if (Array.isArray(statement.Action)) {
            if (!statement.Action.includes('sts:AssumeRole')) {
              errors.push(`Statement ${index + 1} should include "sts:AssumeRole" action`);
            }
          }
        });
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format: ' + error.message]
      };
    }
  }

  async revokeRoleSession(sessionId) {
    // Find the session first to verify it exists
    const findSessionQuery = `
      SELECT * FROM role_sessions 
      WHERE id = $1 AND is_active = true AND expires_at > NOW()
    `;
    
    const result = await this.roleRepository.pool.query(findSessionQuery, [sessionId]);
    
    if (result.rows.length === 0) {
      const error = new Error('Session not found or already inactive');
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    // Deactivate the session
    const revokeQuery = `
      UPDATE role_sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.roleRepository.pool.query(revokeQuery, [sessionId]);

    return { success: true, message: 'Session revoked successfully' };
  }
}

module.exports = RoleService;
