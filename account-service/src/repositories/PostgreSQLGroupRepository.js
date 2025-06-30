const { Group } = require('../models/Group');

class PostgreSQLGroupRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Creates a new group
   * @param {Group} group - Group to create
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Group>} Created group
   */
  async create(group, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO groups (
        id, account_id, name, description, path, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      group.id,
      group.accountId,
      group.name,
      group.description,
      group.path,
      group.createdAt,
      group.updatedAt
    ];

    const result = await dbClient.query(query, values);
    return Group.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a group by ID
   * @param {string} id - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Group|null>} Found group or null
   */
  async findById(id, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM groups 
      WHERE id = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [id, accountId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Group.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds a group by name
   * @param {string} name - Group name
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Group|null>} Found group or null
   */
  async findByName(name, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT * FROM groups 
      WHERE name = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [name, accountId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return Group.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Finds all groups for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Group>>} Array of groups
   */
  async findByAccountId(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT * FROM groups 
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
    return result.rows.map(row => Group.fromDatabaseRow(row));
  }

  /**
   * Finds groups that a user belongs to
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Group>>} Array of groups
   */
  async findGroupsForUser(userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT g.* FROM groups g
      INNER JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = $1 AND g.account_id = $2
      ORDER BY g.name
    `;
    
    const result = await dbClient.query(query, [userId, accountId]);
    return result.rows.map(row => Group.fromDatabaseRow(row));
  }

  /**
   * Updates a group
   * @param {Group} group - Group to update
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Group>} Updated group
   */
  async update(group, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      UPDATE groups 
      SET name = $2, description = $3, path = $4, updated_at = $5
      WHERE id = $1 AND account_id = $6
      RETURNING *
    `;
    
    const values = [
      group.id,
      group.name,
      group.description,
      group.path,
      new Date(),
      group.accountId
    ];

    const result = await dbClient.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Group not found or access denied');
    }
    
    return Group.fromDatabaseRow(result.rows[0]);
  }

  /**
   * Deletes a group
   * @param {string} id - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM groups 
      WHERE id = $1 AND account_id = $2
    `;
    
    const result = await dbClient.query(query, [id, accountId]);
    return result.rowCount > 0;
  }

  /**
   * Counts groups for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<number>} Number of groups
   */
  async count(accountId, options = {}, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT COUNT(*) as count FROM groups 
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
   * Adds a user to a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if added successfully
   */
  async addUserToGroup(groupId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      INSERT INTO user_groups (id, group_id, user_id, created_at)
      VALUES (gen_random_uuid(), $1, $2, NOW())
      ON CONFLICT (user_id, group_id) DO NOTHING
    `;
    
    const result = await dbClient.query(query, [groupId, userId]);
    return true; // ON CONFLICT ensures no error even if already exists
  }

  /**
   * Removes a user from a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if removed, false if not found
   */
  async removeUserFromGroup(groupId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      DELETE FROM user_groups 
      WHERE group_id = $1 AND user_id = $2
    `;
    
    const result = await dbClient.query(query, [groupId, userId]);
    return result.rowCount > 0;
  }

  /**
   * Gets all users in a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<Array<Object>>} Array of user objects
   */
  async getUsersInGroup(groupId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT u.id, u.username, u.email, u.status, ug.created_at as joined_at
      FROM users u
      INNER JOIN user_groups ug ON u.id = ug.user_id
      WHERE ug.group_id = $1 AND u.account_id = $2
      ORDER BY u.username
    `;
    
    const result = await dbClient.query(query, [groupId, accountId]);
    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      status: row.status,
      joinedAt: row.joined_at
    }));
  }

  /**
   * Checks if a user is in a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if user is in group
   */
  async isUserInGroup(groupId, userId, accountId, client = null) {
    const dbClient = client || this.pool;
    
    const query = `
      SELECT 1 FROM user_groups 
      WHERE group_id = $1 AND user_id = $2 AND account_id = $3
    `;
    
    const result = await dbClient.query(query, [groupId, userId, accountId]);
    return result.rows.length > 0;
  }

  /**
   * Checks if a group name exists in an account
   * @param {string} name - Group name
   * @param {string} accountId - Account ID
   * @param {string} [excludeId] - Group ID to exclude from check
   * @param {Object} [client] - Optional database client for transactions
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(name, accountId, excludeId = null, client = null) {
    const dbClient = client || this.pool;
    
    let query = `
      SELECT 1 FROM groups 
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

module.exports = PostgreSQLGroupRepository;
