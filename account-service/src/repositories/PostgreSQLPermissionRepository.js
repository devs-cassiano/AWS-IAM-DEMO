const { Pool } = require('pg');

/**
 * PostgreSQL implementation of PermissionRepository
 * Manages permissions in PostgreSQL database
 */
class PostgreSQLPermissionRepository {
  constructor(pool) {
    this.pool = pool || new Pool();
  }

  /**
   * Safe JSON parse for conditions field
   */
  _parseConditions(conditions) {
    if (typeof conditions === 'string') {
      try {
        return JSON.parse(conditions || '{}');
      } catch (e) {
        return {};
      }
    }
    return conditions || {};
  }

  /**
   * Create a new permission
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} Created permission
   */
  async create(permissionData) {
    const {
      accountId,
      service,
      action,
      resourcePattern = '*',
      effect = 'Allow',
      conditions = {},
      description,
      isSystem = false
    } = permissionData;

    const query = `
      INSERT INTO permissions (
        account_id, service, action, resource_pattern, effect, 
        conditions, description, is_system
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      accountId,
      service,
      action,
      resourcePattern,
      effect,
      JSON.stringify(conditions),
      description,
      isSystem
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find permission by ID
   * @param {string} id - Permission ID
   * @returns {Promise<Object|null>} Permission or null
   */
  async findById(id) {
    const query = 'SELECT * FROM permissions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const permission = result.rows[0];
    permission.conditions = this._parseConditions(permission.conditions);
    return permission;
  }

  /**
   * Find all permissions for an account
   * @param {string} accountId - Account ID (null for system permissions)
   * @returns {Promise<Array>} Array of permissions
   */
  async findByAccountId(accountId) {
    const query = accountId 
      ? 'SELECT * FROM permissions WHERE account_id = $1 ORDER BY service, action'
      : 'SELECT * FROM permissions WHERE account_id IS NULL ORDER BY service, action';
    
    const values = accountId ? [accountId] : [];
    const result = await this.pool.query(query, values);
    
    return result.rows.map(permission => ({
      ...permission,
      conditions: this._parseConditions(permission.conditions)
    }));
  }

  /**
   * Find permissions by service
   * @param {string} service - Service name
   * @param {string} accountId - Account ID (optional)
   * @returns {Promise<Array>} Array of permissions
   */
  async findByService(service, accountId = null) {
    let query, values;
    
    if (accountId) {
      query = 'SELECT * FROM permissions WHERE service = $1 AND (account_id = $2 OR account_id IS NULL) ORDER BY action';
      values = [service, accountId];
    } else {
      query = 'SELECT * FROM permissions WHERE service = $1 AND account_id IS NULL ORDER BY action';
      values = [service];
    }

    const result = await this.pool.query(query, values);
    
    return result.rows.map(permission => ({
      ...permission,
      conditions: this._parseConditions(permission.conditions)
    }));
  }

  /**
   * Find permissions attached to a policy
   * @param {string} policyId - Policy ID
   * @returns {Promise<Array>} Array of permissions
   */
  async findByPolicyId(policyId) {
    const query = `
      SELECT p.*, pp.created_at as attached_at, pp.created_by as attached_by
      FROM permissions p
      INNER JOIN policy_permissions pp ON p.id = pp.permission_id
      WHERE pp.policy_id = $1
      ORDER BY p.service, p.action
    `;

    const result = await this.pool.query(query, [policyId]);
    
    return result.rows.map(permission => ({
      ...permission,
      conditions: this._parseConditions(permission.conditions)
    }));
  }

  /**
   * Find permissions for a role (through policies)
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} Array of permissions with policy context
   */
  async findByRoleId(roleId) {
    const query = `
      SELECT 
        p.*,
        pol.name as policy_name,
        pol.description as policy_description,
        pp.created_at as attached_to_policy_at,
        rp.created_at as policy_attached_to_role_at
      FROM permissions p
      INNER JOIN policy_permissions pp ON p.id = pp.permission_id
      INNER JOIN policies pol ON pp.policy_id = pol.id
      INNER JOIN role_policies rp ON pol.id = rp.policy_id
      WHERE rp.role_id = $1
      ORDER BY p.service, p.action, pol.name
    `;

    const result = await this.pool.query(query, [roleId]);
    
    return result.rows.map(permission => ({
      ...permission,
      conditions: this._parseConditions(permission.conditions)
    }));
  }

  /**
   * Find permissions for a user (through roles and policies)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of permissions with full context
   */
  async findByUserId(userId) {
    const query = `
      SELECT 
        p.*,
        pol.name as policy_name,
        pol.description as policy_description,
        r.name as role_name,
        r.description as role_description,
        pp.created_at as attached_to_policy_at,
        rp.created_at as policy_attached_to_role_at,
        ur.assigned_at as role_assigned_at
      FROM permissions p
      INNER JOIN policy_permissions pp ON p.id = pp.permission_id
      INNER JOIN policies pol ON pp.policy_id = pol.id
      INNER JOIN role_policies rp ON pol.id = rp.policy_id
      INNER JOIN roles r ON rp.role_id = r.id
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
      ORDER BY p.service, p.action, r.name, pol.name
    `;

    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(permission => ({
      ...permission,
      conditions: this._parseConditions(permission.conditions)
    }));
  }

  /**
   * Update permission
   * @param {string} id - Permission ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated permission
   */
  async update(id, updateData) {
    const {
      service,
      action,
      resourcePattern,
      effect,
      conditions,
      description
    } = updateData;

    const query = `
      UPDATE permissions 
      SET service = COALESCE($2, service),
          action = COALESCE($3, action),
          resource_pattern = COALESCE($4, resource_pattern),
          effect = COALESCE($5, effect),
          conditions = COALESCE($6, conditions),
          description = COALESCE($7, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      id,
      service,
      action,
      resourcePattern,
      effect,
      conditions ? JSON.stringify(conditions) : null,
      description
    ];

    const result = await this.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Permission not found');
    }

    const permission = result.rows[0];
    permission.conditions = this._parseConditions(permission.conditions);
    return permission;
  }

  /**
   * Delete permission
   * @param {string} id - Permission ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    // Check if permission is system permission
    const checkQuery = 'SELECT is_system FROM permissions WHERE id = $1';
    const checkResult = await this.pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Permission not found');
    }

    if (checkResult.rows[0].is_system) {
      throw new Error('Cannot delete system permission');
    }

    const query = 'DELETE FROM permissions WHERE id = $1 AND is_system = FALSE';
    const result = await this.pool.query(query, [id]);
    
    return result.rowCount > 0;
  }

  /**
   * Attach permission to policy
   * @param {string} policyId - Policy ID
   * @param {string} permissionId - Permission ID
   * @param {string} createdBy - User who created the attachment
   * @returns {Promise<Object>} Attachment record
   */
  async attachToPolicy(policyId, permissionId, createdBy) {
    const query = `
      INSERT INTO policy_permissions (policy_id, permission_id, created_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (policy_id, permission_id) DO NOTHING
      RETURNING *
    `;

    const result = await this.pool.query(query, [policyId, permissionId, createdBy]);
    
    if (result.rows.length === 0) {
      // Check if already attached
      const checkQuery = 'SELECT * FROM policy_permissions WHERE policy_id = $1 AND permission_id = $2';
      const checkResult = await this.pool.query(checkQuery, [policyId, permissionId]);
      
      if (checkResult.rows.length > 0) {
        return checkResult.rows[0];
      }
      
      throw new Error('Failed to attach permission to policy');
    }

    return result.rows[0];
  }

  /**
   * Detach permission from policy
   * @param {string} policyId - Policy ID
   * @param {string} permissionId - Permission ID
   * @returns {Promise<boolean>} Success status
   */
  async detachFromPolicy(policyId, permissionId) {
    const query = 'DELETE FROM policy_permissions WHERE policy_id = $1 AND permission_id = $2';
    const result = await this.pool.query(query, [policyId, permissionId]);
    
    return result.rowCount > 0;
  }

  /**
   * Get all services with their available permissions
   * @param {string} accountId - Account ID (optional)
   * @returns {Promise<Object>} Services grouped by name with permissions
   */
  async getServicePermissions(accountId = null) {
    let query, values;
    
    if (accountId) {
      query = `
        SELECT service, action, resource_pattern, effect, description, is_system
        FROM permissions 
        WHERE account_id = $1 OR account_id IS NULL
        ORDER BY service, action
      `;
      values = [accountId];
    } else {
      query = `
        SELECT service, action, resource_pattern, effect, description, is_system
        FROM permissions 
        WHERE account_id IS NULL
        ORDER BY service, action
      `;
      values = [];
    }

    const result = await this.pool.query(query, values);
    
    const services = {};
    result.rows.forEach(permission => {
      if (!services[permission.service]) {
        services[permission.service] = [];
      }
      services[permission.service].push({
        action: permission.action,
        resourcePattern: permission.resource_pattern,
        effect: permission.effect,
        description: permission.description,
        isSystem: permission.is_system
      });
    });

    return services;
  }
}

module.exports = { PostgreSQLPermissionRepository };
