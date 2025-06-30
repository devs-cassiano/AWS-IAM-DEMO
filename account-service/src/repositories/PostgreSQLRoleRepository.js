const Role = require('../models/Role');
const RoleSession = require('../models/RoleSession');

class PostgreSQLRoleRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Creates a new role
   * @param {Role} role - Role to create
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Role>} Created role
   */
  async create(role, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO roles (
        id, account_id, name, description, path, assume_role_policy_document, 
        max_session_duration, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      role.id,
      role.accountId,
      role.name,
      role.description,
      role.path,
      JSON.stringify(role.assumeRolePolicyDocument),
      role.maxSessionDuration,
      role.createdAt,
      role.updatedAt
    ];

    const result = await dbClient.query(query, values);
    return this.mapRowToRole(result.rows[0]);
  }

  /**
   * Finds a role by ID
   * @param {string} id - Role ID
   * @param {string} [accountId] - Account ID (optional for backwards compatibility)
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Role|null>} Found role or null
   */
  async findById(id, accountId = null, client = null) {
    const dbClient = client || this.pool;
    
    let query, values;
    
    if (accountId) {
      query = `
        SELECT * FROM roles 
        WHERE id = $1 AND account_id = $2
      `;
      values = [id, accountId];
    } else {
      query = 'SELECT * FROM roles WHERE id = $1';
      values = [id];
    }
    
    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToRole(result.rows[0]);
  }

  /**
   * Finds a role by name
   * @param {string} name - Role name
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Role|null>} Found role or null
   */
  async findByName(name, accountId, client = null) {
    const dbClient = client || this.pool;
    
    let query, values;
    
    if (accountId === null) {
      query = 'SELECT * FROM roles WHERE name = $1 AND account_id IS NULL';
      values = [name];
    } else {
      query = 'SELECT * FROM roles WHERE name = $1 AND account_id = $2';
      values = [name, accountId];
    }
    
    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToRole(result.rows[0]);
  }

  /**
   * Finds all roles for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Role>>} Array of roles
   */
  async findByAccountId(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = 'SELECT * FROM roles WHERE account_id = $1';
    
    const params = [accountId];
    let paramCount = 1;

    // Add path prefix filter
    if (options.pathPrefix) {
      paramCount++;
      query += ` AND path LIKE $${paramCount}`;
      params.push(`${options.pathPrefix}%`);
    }

    query += ' ORDER BY created_at DESC';

    // Add pagination
    if (options.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(options.limit);
    }

    if (options.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(options.offset);
    }
    
    const result = await dbClient.query(query, params);
    return result.rows.map(row => this.mapRowToRole(row));
  }

  /**
   * Updates a role
   * @param {Role} role - Role to update
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Role>} Updated role
   */
  async update(roleId, updatedRoleData, client = null) {
    const dbClient = client || this.pool;
    
    const query = `UPDATE roles SET name = $1, description = $2, assume_role_policy_document = $3, max_session_duration = $4, updated_at = $5 WHERE id = $6 RETURNING *`;
    
    const values = [
      updatedRoleData.name,
      updatedRoleData.description,
      JSON.stringify(updatedRoleData.assumeRolePolicyDocument || updatedRoleData.trustPolicy),
      updatedRoleData.maxSessionDuration,
      updatedRoleData.updatedAt,
      roleId
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Role not found or access denied');
    }
    
    return this.mapRowToRole(result.rows[0]);
  }

  /**
   * Deletes a role
   * @param {string} id - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM roles 
      WHERE id = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [id, accountId]);
    return result.rowCount > 0;
  }

  /**
   * Counts roles for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of roles
   */
  async count(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT COUNT(*) as count FROM roles 
      WHERE account_id = $1
    `;
    
    const params = [accountId];
    let paramCount = 1;

    // Add path prefix filter
    if (options.pathPrefix) {
      paramCount++;
      query += ` AND path LIKE $${paramCount}`;
      params.push(`${options.pathPrefix}%`);
    }
    
    const result = await dbClient.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Attaches a policy to a role
   * @param {string} roleId - Role ID
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if attached successfully
   */
  async attachPolicy(roleId, policyId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO role_policies (id, account_id, role_id, policy_id, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
      ON CONFLICT (role_id, policy_id) DO NOTHING
    `;
    
    await dbClient.query(query, [accountId, roleId, policyId]);
    return true;
  }

  /**
   * Detaches a policy from a role
   * @param {string} roleId - Role ID
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if detached, false if not found
   */
  async detachPolicy(roleId, policyId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM role_policies 
      WHERE role_id = $1 AND policy_id = $2 AND account_id = $3
    `;
    
    const result = await dbClient.query(query, [roleId, policyId, accountId]);
    return result.rowCount > 0;
  }

  /**
   * Gets all policies attached to a role
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Object>>} Array of policies
   */
  async getRolePolicies(roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT p.* FROM policies p
      INNER JOIN role_policies rp ON p.id = rp.policy_id
      WHERE rp.role_id = $1 AND rp.account_id = $2
      ORDER BY p.name
    `;
    
    const result = await dbClient.query(query, [roleId, accountId]);
    return result.rows;
  }

  /**
   * Finds a role session by ID
   * @param {string} sessionId - Session ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<RoleSession|null>} Found session or null
   */
  async findSessionById(sessionId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM role_sessions 
      WHERE id = $1
    `;
    
    const result = await dbClient.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return RoleSession.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds active role sessions for a role
   * @param {string} roleId - Role ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<RoleSession>>} Array of active sessions
   */
  async findActiveSessionsForRole(roleId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM role_sessions 
      WHERE role_id = $1 AND account_id = $2 
        AND is_active = true AND expires_at > NOW()
      ORDER BY assumed_at DESC
    `;
    
    const result = await dbClient.query(query, [roleId, accountId]);
    return result.rows.map(row => RoleSession.fromDatabaseRow(row));
  }

  /**
   * Updates a role session
   * @param {RoleSession} session - Session to update
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<RoleSession>} Updated session
   */
  async updateSession(session, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      UPDATE role_sessions 
      SET expires_at = $2, is_active = $3, updated_at = $4
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [
      session.id,
      session.expiresAt,
      session.isActive,
      new Date()
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Role session not found');
    }
    
    return RoleSession.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Deactivates expired sessions
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of deactivated sessions
   */
  async deactivateExpiredSessions(client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      UPDATE role_sessions 
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true AND expires_at <= NOW()
    `;
    
    const result = await dbClient.query(query);
    return result.rowCount;
  }

  /**
   * Checks if a role name exists in an account
   * @param {string} name - Role name
   * @param {string} accountId - Account ID
   * @param {string} [excludeId] - Role ID to exclude from check
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(name, accountId, excludeId = null, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT 1 FROM roles 
      WHERE name = $1 AND account_id = $2
    `;
    
    const params = [name, accountId];
    
    if (excludeId) {
      query += ` AND id != $3`;
      params.push(excludeId);
    }
    
    const result = await dbClient.query(query, params);
    return result.rows.length > 0;
  }

  // Session-related methods
  async createSession(sessionData, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO role_sessions (
        id, account_id, role_id, user_id, session_name, external_id,
        source_ip, user_agent, assumed_at, expires_at, session_token_hash,
        is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      sessionData.id,
      sessionData.accountId,
      sessionData.roleId,
      sessionData.userId,
      sessionData.sessionName,
      sessionData.externalId,
      sessionData.sourceIp,
      sessionData.userAgent,
      sessionData.assumedAt,
      sessionData.expiresAt,
      sessionData.sessionTokenHash,
      sessionData.isActive !== undefined ? sessionData.isActive : true,
      sessionData.createdAt || new Date(),
      sessionData.updatedAt || new Date()
    ];
    
    const result = await dbClient.query(query, values);
    return this.mapRowToSession(result.rows[0]);
  }

  async findSession(sessionId, client = null) {
    const dbClient = client || this.pool;
    
    const query = 'SELECT * FROM role_sessions WHERE id = $1';
    const result = await dbClient.query(query, [sessionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToSession(result.rows[0]);
  }

  async findSessionsByRole(roleId, client = null) {
    const dbClient = client || this.pool;
    
    const query = 'SELECT * FROM role_sessions WHERE role_id = $1 ORDER BY created_at DESC';
    const result = await dbClient.query(query, [roleId]);
    
    return result.rows.map(row => this.mapRowToSession(row));
  }

  async deleteSession(sessionId, client = null) {
    const dbClient = client || this.pool;
    
    const query = 'DELETE FROM role_sessions WHERE id = $1';
    const result = await dbClient.query(query, [sessionId]);
    
    return result.rowCount > 0;
  }

  async cleanupExpiredSessions(client = null) {
    const dbClient = client || this.pool;
    
    const query = 'DELETE FROM role_sessions WHERE expires_at < NOW()';
    const result = await dbClient.query(query);
    
    return result.rowCount;
  }

  // Helper methods
  mapRowToRole(row) {
    const assumeRolePolicyDocument = row.assume_role_policy_document ? 
      (typeof row.assume_role_policy_document === 'string' ? JSON.parse(row.assume_role_policy_document) : row.assume_role_policy_document) : 
      null;
      
    return new Role({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      description: row.description,
      path: row.path,
      assumeRolePolicyDocument: assumeRolePolicyDocument,
      maxSessionDuration: row.max_session_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  mapRowToSession(row) {
    return new RoleSession({
      id: row.id,
      accountId: row.account_id,
      roleId: row.role_id,
      userId: row.user_id,
      assumedBy: row.assumed_by || row.user_id, // Support both field names
      sessionName: row.session_name,
      credentials: row.credentials ? JSON.parse(row.credentials) : null,
      externalId: row.external_id,
      sourceIp: row.source_ip,
      userAgent: row.user_agent,
      assumedAt: row.assumed_at,
      expiresAt: row.expires_at,
      sessionTokenHash: row.session_token_hash,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}

module.exports = PostgreSQLRoleRepository;
