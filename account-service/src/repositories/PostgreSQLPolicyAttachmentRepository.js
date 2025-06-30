const PolicyAttachment = require('../models/PolicyAttachment');

class PostgreSQLPolicyAttachmentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Attaches a policy to a user
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment>} Created attachment
   */
  async attachPolicyToUser(policyId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const attachment = PolicyAttachment.forUser({ accountId, policyId, userId });
    
    const query = `
      INSERT INTO user_policies (id, policy_id, user_id, attached_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, policy_id) DO NOTHING
      RETURNING *
    `;
    
    const values = [
      attachment.id,
      attachment.policyId,
      attachment.targetId,
      attachment.createdAt
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      // Policy already attached, return existing attachment
      return await this.findUserPolicyAttachment(policyId, userId, accountId, client);
    }
    
    return PolicyAttachment.fromDatabaseRow({
      ...result.rows[0],
      target_type: 'user',
      target_id: result.rows[0].user_id
    });
  }

  /**
   * Attaches a policy to a group
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment>} Created attachment
   */
  async attachPolicyToGroup(policyId, groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const attachment = PolicyAttachment.forGroup({ accountId, policyId, groupId });
    
    const query = `
      INSERT INTO group_policies (id, policy_id, group_id, attached_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (group_id, policy_id) DO NOTHING
      RETURNING *
    `;
    
    const values = [
      attachment.id,
      attachment.policyId,
      attachment.targetId,
      attachment.createdAt
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      // Policy already attached, return existing attachment
      return await this.findGroupPolicyAttachment(policyId, groupId, accountId, client);
    }
    
    return PolicyAttachment.fromDatabaseRow({
      ...result.rows[0],
      target_type: 'group',
      target_id: result.rows[0].group_id
    });
  }

  /**
   * Attaches a policy to a role
   * @param {string} policyId - Policy ID
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment>} Created attachment
   */
  async attachPolicyToRole(policyId, roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const attachment = PolicyAttachment.forRole({ accountId, policyId, roleId });
    
    const query = `
      INSERT INTO role_policies (id, account_id, role_id, policy_id, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (role_id, policy_id) DO NOTHING
      RETURNING *
    `;
    
    const values = [
      attachment.id,
      accountId,
      roleId,
      policyId,
      attachment.createdAt
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      // Policy already attached, return existing attachment
      return await this.findRolePolicyAttachment(policyId, roleId, accountId, client);
    }
    
    return PolicyAttachment.fromDatabaseRow({
      ...result.rows[0],
      target_type: 'role',
      target_id: result.rows[0].role_id
    });
  }

  /**
   * Detaches a policy from a user
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if detached, false if not found
   */
  async detachPolicyFromUser(policyId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM user_policies 
      WHERE policy_id = $1 AND user_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, userId]);
    return result.rowCount > 0;
  }

  /**
   * Detaches a policy from a group
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if detached, false if not found
   */
  async detachPolicyFromGroup(policyId, groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM group_policies 
      WHERE policy_id = $1 AND group_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, groupId]);
    return result.rowCount > 0;
  }

  /**
   * Detaches a policy from a role
   * @param {string} policyId - Policy ID
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if detached successfully
   */
  async detachPolicyFromRole(policyId, roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM role_policies 
      WHERE policy_id = $1 AND role_id = $2 AND account_id = $3
    `;
    
    const result = await dbClient.query(query, [policyId, roleId, accountId]);
    
    return result.rowCount > 0;
  }

  /**
   * Finds a user policy attachment
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment|null>} Found attachment or null
   */
  async findUserPolicyAttachment(policyId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT *, 'user' as target_type, user_id as target_id
      FROM user_policies 
      WHERE policy_id = $1 AND user_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, userId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return PolicyAttachment.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a specific group policy attachment
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment|null>} Found attachment or null
   */
  async findGroupPolicyAttachment(policyId, groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT *, 'group' as target_type, group_id as target_id
      FROM group_policies 
      WHERE policy_id = $1 AND group_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, groupId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return PolicyAttachment.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a specific role policy attachment
   * @param {string} policyId - Policy ID
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment|null>} Found attachment or null
   */
  async findRolePolicyAttachment(policyId, roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM role_policies 
      WHERE policy_id = $1 AND role_id = $2 AND account_id = $3
    `;
    
    const result = await dbClient.query(query, [policyId, roleId, accountId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return PolicyAttachment.fromDatabaseRow({
      ...result.rows[0],
      target_type: 'role',
      target_id: result.rows[0].role_id
    });
  }

  /**
   * Gets all policies attached to a user (directly)
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<PolicyAttachment>>} Array of attachments
   */
  async findUserPolicyAttachments(userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT *, 'user' as target_type, user_id as target_id
      FROM user_policies 
      WHERE user_id = $1
      ORDER BY created_at
    `;
    
    const result = await dbClient.query(query, [userId]);
    return result.rows.map(row => PolicyAttachment.fromDatabaseRow(row));
  }

  /**
   * Gets all policies attached to a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<PolicyAttachment>>} Array of attachments
   */
  async findGroupPolicyAttachments(groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT *, 'group' as target_type, group_id as target_id
      FROM group_policies 
      WHERE group_id = $1
      ORDER BY created_at
    `;
    
    const result = await dbClient.query(query, [groupId]);
    return result.rows.map(row => PolicyAttachment.fromDatabaseRow(row));
  }

  /**
   * Gets all policies attached to a role
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<PolicyAttachment>>} Array of attachments
   */
  async findRolePolicyAttachments(roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT *, 'role' as target_type, role_id as target_id
      FROM role_policies 
      WHERE role_id = $1
      ORDER BY created_at
    `;
    
    const result = await dbClient.query(query, [roleId]);
    return result.rows.map(row => PolicyAttachment.fromDatabaseRow(row));
  }

  /**
   * Gets all attachments for a policy
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<PolicyAttachment>>} Array of attachments
   */
  async findPolicyAttachments(policyId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    // Get user attachments
    const userQuery = `
      SELECT *, 'user' as target_type, user_id as target_id
      FROM user_policies 
      WHERE policy_id = $1
    `;
    
    // Get group attachments
    const groupQuery = `
      SELECT *, 'group' as target_type, group_id as target_id
      FROM group_policies 
      WHERE policy_id = $1
    `;
    
    // Get role attachments
    const roleQuery = `
      SELECT *, 'role' as target_type, role_id as target_id
      FROM role_policies 
      WHERE policy_id = $1
    `;
    
    const [userResult, groupResult, roleResult] = await Promise.all([
      dbClient.query(userQuery, [policyId, accountId]),
      dbClient.query(groupQuery, [policyId, accountId]),
      dbClient.query(roleQuery, [policyId, accountId])
    ]);
    
    const attachments = [
      ...userResult.rows.map(row => PolicyAttachment.fromDatabaseRow(row)),
      ...groupResult.rows.map(row => PolicyAttachment.fromDatabaseRow(row)),
      ...roleResult.rows.map(row => PolicyAttachment.fromDatabaseRow(row))
    ];
    
    return attachments.sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Checks if a policy is attached to a user
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if attached
   */
  async isPolicyAttachedToUser(policyId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT 1 FROM user_policies 
      WHERE policy_id = $1 AND user_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Checks if a policy is attached to a group
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if attached
   */
  async isPolicyAttachedToGroup(policyId, groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT 1 FROM group_policies 
      WHERE policy_id = $1 AND group_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, groupId]);
    return result.rows.length > 0;
  }

  /**
   * Checks if a policy is attached to a role
   * @param {string} policyId - Policy ID
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if attached
   */
  async isPolicyAttachedToRole(policyId, roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT 1 FROM role_policies 
      WHERE policy_id = $1 AND role_id = $2
    `;
    
    const result = await dbClient.query(query, [policyId, roleId]);
    return result.rows.length > 0;
  }

  /**
   * Detaches all policies from a user
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of detached policies
   */
  async detachAllPoliciesFromUser(userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM user_policies 
      WHERE user_id = $1
    `;
    
    const result = await dbClient.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Detaches all policies from a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of detached policies
   */
  async detachAllPoliciesFromGroup(groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM group_policies 
      WHERE group_id = $1
    `;
    
    const result = await dbClient.query(query, [groupId]);
    return result.rowCount;
  }

  /**
   * Detaches all policies from a role
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of detached policies
   */
  async detachAllPoliciesFromRole(roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM role_policies 
      WHERE role_id = $1
    `;
    
    const result = await dbClient.query(query, [roleId]);
    return result.rowCount;
  }

  /**
   * Detaches a policy from all targets
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of detached targets
   */
  async detachPolicyFromAllTargets(policyId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const userQuery = `
      DELETE FROM user_policies 
      WHERE policy_id = $1
    `;
    
    const groupQuery = `
      DELETE FROM group_policies 
      WHERE policy_id = $1
    `;
    
    const roleQuery = `
      DELETE FROM role_policies 
      WHERE policy_id = $1
    `;
    
    const [userResult, groupResult, roleResult] = await Promise.all([
      dbClient.query(userQuery, [policyId, accountId]),
      dbClient.query(groupQuery, [policyId, accountId]),
      dbClient.query(roleQuery, [policyId, accountId])
    ]);
    
    return userResult.rowCount + groupResult.rowCount + roleResult.rowCount;
  }

  /**
   * Create a generic policy attachment
   * @param {Object} attachment - Attachment data
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<PolicyAttachment>} Created attachment
   */
  async create(attachment, client = null) {
    // This method is used by RoleService.attachPolicy
    const { roleId, policyId, id } = attachment;
    
    // We need to get the accountId from the role or policy
    // For now, let's get it from the role table
    const dbClient = client || this.pool;
    
    const roleQuery = 'SELECT account_id FROM roles WHERE id = $1';
    const roleResult = await dbClient.query(roleQuery, [roleId]);
    
    if (roleResult.rows.length === 0) {
      throw new Error('Role not found');
    }
    
    const accountId = roleResult.rows[0].account_id;
    
    const query = `
      INSERT INTO role_policies (id, account_id, role_id, policy_id, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (role_id, policy_id) DO NOTHING
      RETURNING *
    `;
    
    const values = [
      id,
      accountId,
      roleId,
      policyId,
      new Date()
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      // Policy already attached, return existing attachment
      return await this.findRolePolicyAttachment(policyId, roleId, accountId, client);
    }
    
    return PolicyAttachment.fromDatabaseRow({
      ...result.rows[0],
      target_type: 'role',
      target_id: result.rows[0].role_id
    });
  }
}

module.exports = PostgreSQLPolicyAttachmentRepository;
