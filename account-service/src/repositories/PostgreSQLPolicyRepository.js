const Policy = require('../models/Policy');

class PostgreSQLPolicyRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Creates a new policy
   * @param {Policy} policy - Policy to create
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Policy>} Created policy
   */
  async create(policy, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO policies (
        id, account_id, name, description, path, policy_document, policy_type, is_attachable, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      policy.id,
      policy.accountId,
      policy.name,
      policy.description,
      policy.path,
      JSON.stringify(policy.document),
      policy.type,
      true, // is_attachable (substitui is_default)
      policy.createdAt,
      policy.updatedAt
    ];

    const result = await dbClient.query(query, values);
    return Policy.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a policy by ID
   * @param {string} id - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Policy|null>} Found policy or null
   */
  async findById(id, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM policies 
      WHERE id = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [id, accountId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Policy.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a policy by name
   * @param {string} name - Policy name
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Policy|null>} Found policy or null
   */
  async findByName(name, accountId, client = null) {
    const dbClient = client || this.pool;
    
    let query, values;
    
    if (accountId === null) {
      query = `
        SELECT * FROM policies 
        WHERE name = $1 AND account_id IS NULL
      `;
      values = [name];
    } else {
      query = `
        SELECT * FROM policies 
        WHERE name = $1 AND account_id = $2
      `;
      values = [name, accountId];
    }
    
    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Policy.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds all policies for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {string} [options.type] - Filter by policy type
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Policy>>} Array of policies
   */
  async findByAccountId(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT * FROM policies 
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

    // Add type filter
    if (options.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(options.type);
    }

    query += ` ORDER BY created_at DESC`;

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
    return result.rows.map(row => Policy.fromDatabaseRow(row));
  }

  /**
   * Finds default system policies
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Policy>>} Array of default policies
   */
  async findDefaultPolicies(client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM policies 
      WHERE policy_type = 'AWS'
      ORDER BY name
    `;
    
    const result = await dbClient.query(query);
    return result.rows.map(row => Policy.fromDatabaseRow(row));
  }

  /**
   * Updates a policy
   * @param {Policy} policy - Policy to update
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Policy>} Updated policy
   */
  async update(policy, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      UPDATE policies 
      SET name = $2, description = $3, path = $4, policy_document = $5, 
          policy_type = $6, updated_at = $7
      WHERE id = $1 AND account_id = $8
      RETURNING *
    `;
    
    const values = [
      policy.id,
      policy.name,
      policy.description,
      policy.path,
      JSON.stringify(policy.document),
      policy.type,
      new Date(),
      policy.accountId
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Policy not found or access denied');
    }
    
    return Policy.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Deletes a policy
   * @param {string} id - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM policies 
      WHERE id = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [id, accountId]);
    return result.rowCount > 0;
  }

  /**
   * Counts policies for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {string} [options.type] - Filter by policy type
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of policies
   */
  async count(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT COUNT(*) as count FROM policies 
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

    // Add type filter
    if (options.type) {
      paramCount++;
      query += ` AND type = $${paramCount}`;
      params.push(options.type);
    }
    
    const result = await dbClient.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Finds policies attached to a user (directly or through groups)
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Policy>>} Array of policies
   */
  async findPoliciesForUser(userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT DISTINCT p.* FROM policies p
      WHERE p.account_id = $2 AND (
        -- Direct user policies
        p.id IN (
          SELECT policy_id FROM user_policies 
          WHERE user_id = $1
        )
        OR
        -- Group policies
        p.id IN (
          SELECT gp.policy_id FROM group_policies gp
          INNER JOIN user_groups ug ON gp.group_id = ug.group_id
          WHERE ug.user_id = $1
        )
      )
      ORDER BY p.name
    `;
    
    const result = await dbClient.query(query, [userId, accountId]);
    return result.rows.map(row => Policy.fromDatabaseRow(row));
  }

  /**
   * Finds policies attached to a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Policy>>} Array of policies
   */
  async findPoliciesForGroup(groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT p.* FROM policies p
      INNER JOIN group_policies gp ON p.id = gp.policy_id
      WHERE gp.group_id = $1 AND p.account_id = $2
      ORDER BY p.name
    `;
    
    const result = await dbClient.query(query, [groupId, accountId]);
    return result.rows.map(row => Policy.fromDatabaseRow(row));
  }

  /**
   * Checks if a policy name exists in an account
   * @param {string} name - Policy name
   * @param {string} accountId - Account ID
   * @param {string} [excludeId] - Policy ID to exclude from check
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(name, accountId, excludeId = null, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT 1 FROM policies 
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
}

module.exports = PostgreSQLPolicyRepository;
