/**
 * PostgreSQL implementation for User-Role relationship repository
 * Manages the assignment of roles to users
 */
class PostgreSQLUserRoleRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Create a new user-role assignment
   * @param {Object} assignment - Assignment data
   * @param {string} assignment.userId - User ID
   * @param {string} assignment.roleId - Role ID
   * @param {string} assignment.assignedBy - Who assigned the role
   * @param {Date} assignment.assignedAt - When the role was assigned
   * @returns {Promise<Object>} Created assignment
   */
  async create(assignment) {
    const query = `
      INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      assignment.userId,
      assignment.roleId,
      assignment.assignedBy || 'system',
      assignment.assignedAt || new Date()
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find user-role assignment by user and role
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise<Object|null>} Assignment or null
   */
  async findByUserAndRole(userId, roleId) {
    const query = `
      SELECT ur.*, r.name as role_name, r.description as role_description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND ur.role_id = $2
    `;
    
    const result = await this.pool.query(query, [userId, roleId]);
    return result.rows[0] || null;
  }

  /**
   * Get all roles assigned to a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of role assignments
   */
  async findByUserId(userId) {
    const query = `
      SELECT ur.*, r.name as role_name, r.description as role_description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
      ORDER BY ur.assigned_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get all users assigned to a role
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} Array of user assignments
   */
  async findByRoleId(roleId) {
    const query = `
      SELECT ur.*, u.username, u.email, u.user_type
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.role_id = $1
      ORDER BY ur.assigned_at DESC
    `;
    
    const result = await this.pool.query(query, [roleId]);
    return result.rows;
  }

  /**
   * Remove a user-role assignment
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Promise<boolean>} True if removed, false if not found
   */
  async remove(userId, roleId) {
    const query = `
      DELETE FROM user_roles
      WHERE user_id = $1 AND role_id = $2
    `;
    
    const result = await this.pool.query(query, [userId, roleId]);
    return result.rowCount > 0;
  }

  /**
   * Remove all role assignments for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of assignments removed
   */
  async removeAllByUserId(userId) {
    const query = `
      DELETE FROM user_roles
      WHERE user_id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Remove all user assignments for a role
   * @param {string} roleId - Role ID
   * @returns {Promise<number>} Number of assignments removed
   */
  async removeAllByRoleId(roleId) {
    const query = `
      DELETE FROM user_roles
      WHERE role_id = $1
    `;
    
    const result = await this.pool.query(query, [roleId]);
    return result.rowCount;
  }

  /**
   * Check if a user has a specific role
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} True if user has the role
   */
  async userHasRole(userId, roleName) {
    const query = `
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1 AND r.name = $2
    `;
    
    const result = await this.pool.query(query, [userId, roleName]);
    return result.rows.length > 0;
  }

  /**
   * Get all permissions for a user through their roles
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of permissions
   */
  async getUserPermissionsThroughRoles(userId) {
    const query = `
      SELECT DISTINCT p.id, p.name, p.description, p.document, p.type
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_policies rp ON r.id = rp.role_id
      JOIN policies p ON rp.policy_id = p.id
      WHERE ur.user_id = $1
      ORDER BY p.name
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = { PostgreSQLUserRoleRepository };
