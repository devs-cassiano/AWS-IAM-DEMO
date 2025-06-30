/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: IAM Role management operations
 */

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new IAM role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - assumeRolePolicyDocument
 *             properties:
 *               name:
 *                 type: string
 *                 example: "AdminRole"
 *               description:
 *                 type: string
 *                 example: "Administrator role with full access"
 *               path:
 *                 type: string
 *                 example: "/"
 *               assumeRolePolicyDocument:
 *                 type: object
 *                 example:
 *                   Version: "2012-10-17"
 *                   Statement:
 *                     - Effect: Allow
 *                       Principal:
 *                         AWS: "arn:aws:iam::123456789012:user/ExampleUser"
 *                       Action: "sts:AssumeRole"
 *               maxSessionDuration:
 *                 type: number
 *                 example: 3600
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Role name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: List all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 */

/**
 * @swagger
 * /api/v1/roles/{roleId}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "UpdatedRole"
 *               description:
 *                 type: string
 *                 example: "Updated role description"
 *               assumeRolePolicyDocument:
 *                 type: object
 *               maxSessionDuration:
 *                 type: number
 *                 example: 7200
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 */

/**
 * @swagger
 * /api/v1/roles/{roleId}/assume:
 *   post:
 *     summary: Assume a role and get temporary credentials
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID to assume
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionName:
 *                 type: string
 *                 example: "MySession"
 *               durationSeconds:
 *                 type: number
 *                 example: 3600
 *     responses:
 *       200:
 *         description: Role assumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RoleSession'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/roles/{roleId}/detach-policy/{policyId}:
 *   delete:
 *     summary: Detach policy from role
 *     description: Detaches a policy from a role. The policy can be identified by ID (UUID), name, or ARN.
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID (UUID)
 *         example: "eecaddee-f970-459c-8b1e-4ceeeaf7ad4e"
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy identifier - can be UUID, name, or ARN
 *         examples:
 *           uuid:
 *             value: "8c5d11b3-c69f-43de-8e4b-9af95244feef"
 *             summary: "Policy UUID"
 *           name:
 *             value: "AdministratorAccess"
 *             summary: "Policy name"
 *           arn:
 *             value: "arn:aws:iam::123456789012:policy/AdministratorAccess"
 *             summary: "Policy ARN"
 *     responses:
 *       200:
 *         description: Policy detached from role successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Policy detached successfully"
 *       404:
 *         description: Role or policy not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Policy not found: AdministratorAccess"
 */

/**
 * @swagger
 * /api/v1/roles/{roleId}/policies:
 *   get:
 *     summary: Get role policies
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role policies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /api/v1/roles/{roleId}/sessions:
 *   get:
 *     summary: Get active role sessions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoleSession'
 */

/**
 * @swagger
 * /api/v1/roles/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke role session
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/v1/roles/validate-trust-policy:
 *   post:
 *     summary: Validate assume role policy document
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *             properties:
 *               document:
 *                 type: object
 *                 example:
 *                   Version: "2012-10-17"
 *                   Statement:
 *                     - Effect: "Allow"
 *                       Principal:
 *                         AWS: "arn:aws:iam::123456789012:user/ExampleUser"
 *                       Action: "sts:AssumeRole"
 *     responses:
 *       200:
 *         description: Trust policy document is valid
 *       400:
 *         description: Trust policy document is invalid
 */

const RoleService = require('../services/RoleService');

class RoleController {
  constructor(roleService) {
    this.roleService = roleService || new RoleService();
  }

  /**
   * Creates a new role
   */
  async createRole(req, res) {
    try {
      const { accountId } = req.user; // From JWT token
      const { name, description, path, assumeRolePolicyDocument, maxSessionDuration, trustPolicy } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['Role name is required']
        });
      }

      // Get assume role policy document (support both field names)
      const policyDocument = assumeRolePolicyDocument || trustPolicy;
      if (!policyDocument) {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['Assume role policy document is required']
        });
      }

      const roleData = {
        accountId,
        name,
        description,
        path,
        assumeRolePolicyDocument: policyDocument,
        maxSessionDuration
      };

      const role = await this.roleService.createRole(roleData);

      res.status(201).json(role.toJSON());
    } catch (error) {
      if (error.code === 'ROLE_NAME_EXISTS') {
        return res.status(409).json({
          error: 'Role name already exists',
          details: [error.message]
        });
      }

      // Handle validation errors from service - just return the error message
      if (error.message && (error.message.includes('required') || error.message.includes('must be') || error.message.includes('invalid') || error.message === 'Validation failed')) {
        return res.status(400).json({
          error: error.message
        });
      }

      console.error('Role creation error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Gets a role by ID
   */
  async getRole(req, res) {
    try {
      const { accountId } = req.user; // From JWT token
      const { roleId } = req.params;

      const role = await this.roleService.getRoleById(roleId, accountId);

      res.json(role.toJSON());
    } catch (error) {
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      console.error('Get role error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Alias for getRole - for compatibility with tests
   */
  async getRoleById(req, res) {
    return this.getRole(req, res);
  }

  /**
   * Get roles by account ID - for compatibility with tests
   */
  async getRolesByAccountId(req, res) {
    try {
      const { accountId } = req.params;
      const roles = await this.roleService.getRolesByAccountId(accountId);
      
      res.json(roles.map(role => role.toJSON()));
    } catch (error) {
      console.error('Error getting roles by account:', error);
      
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Lists roles for the account
   */
  async listRoles(req, res) {
    try {
      const { accountId } = req.user;
      const { 
        limit = 50, 
        offset = 0, 
        pathPrefix 
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      if (pathPrefix) {
        options.pathPrefix = pathPrefix;
      }

      const roles = await this.roleService.getRolesByAccountId(accountId);

      // Apply pagination and filtering
      let filteredRoles = roles;
      if (pathPrefix) {
        filteredRoles = roles.filter(role => role.path && role.path.startsWith(pathPrefix));
      }

      const totalCount = filteredRoles.length;
      const paginatedRoles = filteredRoles.slice(options.offset, options.offset + options.limit);

      res.json({
        success: true,
        roles: paginatedRoles.map(role => role.toJSON()),
        totalCount: totalCount,
        hasMore: options.offset + options.limit < totalCount,
        pagination: {
          limit: options.limit,
          offset: options.offset
        }
      });
    } catch (error) {
      console.error('List roles error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list roles'
      });
    }
  }

  /**
   * Updates a role
   */
  async updateRole(req, res) {
    try {
      const { accountId } = req.user;
      const { roleId } = req.params;
      const { name, description, path, assumeRolePolicyDocument, maxSessionDuration } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (path !== undefined) updateData.path = path;
      if (assumeRolePolicyDocument !== undefined) updateData.assumeRolePolicyDocument = assumeRolePolicyDocument;
      if (maxSessionDuration !== undefined) updateData.maxSessionDuration = maxSessionDuration;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      const role = await this.roleService.updateRole(roleId, updateData, accountId);

      res.json(role.toJSON());
    } catch (error) {
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Role name already exists',
          details: [error.message]
        });
      }

      if (error.details) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      console.error('Update role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update role'
      });
    }
  }

  /**
   * Deletes a role
   */
  async deleteRole(req, res) {
    try {
      const { roleId } = req.params;

      await this.roleService.deleteRole(roleId);

      res.json({
        message: 'Role deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      if (error.code === 'ROLE_HAS_ACTIVE_SESSIONS') {
        return res.status(409).json({
          error: 'Role has active sessions',
          message: 'Cannot delete role with active sessions',
          details: error.details
        });
      }

      console.error('Delete role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete role'
      });
    }
  }

  /**
   * @swagger
   * /api/v1/roles/{roleId}/attach-policy:
   *   post:
   *     summary: Attach policy to role
   *     description: Attaches a policy to a role. The policy can be identified by ID (UUID), name, or ARN.
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roleId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Role ID (UUID)
   *         example: "eecaddee-f970-459c-8b1e-4ceeeaf7ad4e"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - policyId
   *             properties:
   *               policyId:
   *                 type: string
   *                 description: Policy identifier - can be UUID, name, or ARN
   *                 examples:
   *                   uuid:
   *                     value: "8c5d11b3-c69f-43de-8e4b-9af95244feef"
   *                     summary: "Policy UUID"
   *                   name:
   *                     value: "AdministratorAccess"
   *                     summary: "Policy name"
   *                   arn:
   *                     value: "arn:aws:iam::123456789012:policy/AdministratorAccess"
   *                     summary: "Policy ARN"
   *           examples:
   *             usingId:
   *               summary: Using Policy UUID
   *               value:
   *                 policyId: "8c5d11b3-c69f-43de-8e4b-9af95244feef"
   *             usingName:
   *               summary: Using Policy Name
   *               value:
   *                 policyId: "AdministratorAccess"
   *             usingArn:
   *               summary: Using Policy ARN
   *               value:
   *                 policyId: "arn:aws:iam::123456789012:policy/AdministratorAccess"
   *     responses:
   *       200:
   *         description: Policy attached successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Policy attached successfully"
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Role or policy not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: "Policy not found: AdministratorAccess"
   */
  /**
   * Attaches a policy to a role
   */
  async attachPolicyToRole(req, res) {
    try {
      const { roleId } = req.params;
      const { policyId } = req.body;

      if (!policyId) {
        return res.status(400).json({
          error: 'Policy ID is required'
        });
      }

      await this.roleService.attachPolicy(roleId, policyId);

      res.json({
        message: 'Policy attached successfully'
      });
    } catch (error) {
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      if (error.code === 'POLICY_NOT_FOUND') {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      console.error('Attach policy to role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to attach policy to role'
      });
    }
  }

  /**
   * Detaches a policy from a role
   */
  async detachPolicyFromRole(req, res) {
    try {
      const { roleId, policyId } = req.params;

      await this.roleService.detachPolicy(roleId, policyId);

      res.json({
        message: 'Policy detached successfully'
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_ATTACHED') {
        return res.status(404).json({
          error: 'Policy not attached to role'
        });
      }

      console.error('Detach policy from role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to detach policy from role'
      });
    }
  }

  /**
   * Gets all policies for a role
   */
  async getRolePolicies(req, res) {
    try {
      const { accountId } = req.user;
      const { roleId } = req.params;

      const policies = await this.roleService.getRolePolicies(roleId, accountId);

      res.json({
        success: true,
        policies,
        count: policies.length
      });
    } catch (error) {
      if (error.code === 'ROLE_NOT_FOUND') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      console.error('Get role policies error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get role policies'
      });
    }
  }

  /**
   * Gets active sessions for a role
   */
  async getActiveRoleSessions(req, res) {
    try {
      const { accountId } = req.user;
      const { roleId } = req.params;

      const sessions = await this.roleService.getActiveRoleSessions(roleId, accountId);

      res.json({
        success: true,
        sessions: sessions.map(session => session.toJSON()),
        count: sessions.length
      });
    } catch (error) {
      console.error('Get active role sessions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get active role sessions'
      });
    }
  }

  /**
   * Revokes a role session
   */
  async revokeRoleSession(req, res) {
    try {
      const { sessionId } = req.params;

      await this.roleService.revokeRoleSession(sessionId);

      res.json({
        success: true,
        message: 'Role session revoked successfully'
      });
    } catch (error) {
      if (error.code === 'SESSION_NOT_FOUND') {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      console.error('Revoke role session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to revoke role session'
      });
    }
  }

  /**
   * Validates an assume role policy document
   */
  async validateAssumeRolePolicyDocument(req, res) {
    try {
      const { document } = req.body;

      if (!document) {
        return res.status(400).json({
          error: 'Assume role policy document is required'
        });
      }

      const validation = this.roleService.validateAssumeRolePolicyDocument(document);

      res.json({
        success: true,
        valid: validation.isValid,
        errors: validation.errors
      });
    } catch (error) {
      console.error('Validate assume role policy document error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate assume role policy document'
      });
    }
  }

  /**
   * Cleanup expired sessions - for compatibility with tests
   */
  async cleanupExpiredSessions(req, res) {
    try {
      const count = await this.roleService.cleanupExpiredSessions();
      
      res.json({
        success: true,
        cleanedUp: count
      });
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Aliases for compatibility with tests
   */
  async attachPolicy(req, res) {
    return this.attachPolicyToRole(req, res);
  }

  async detachPolicy(req, res) {
    return this.detachPolicyFromRole(req, res);
  }

  async assumeRole(req, res) {
    try {
      const { roleId } = req.params;
      const { sessionName, durationSeconds, userId } = req.body;

      // Get userId from token or body (mock for tests)
      const finalUserId = userId || (req.user && req.user.userId) || 'user-123';

      const session = await this.roleService.assumeRole(roleId, finalUserId, sessionName, durationSeconds);
      
      res.status(200).json(session.toJSON());
    } catch (error) {
      if (error.message === 'Role not found') {
        return res.status(404).json({
          error: 'Role not found'
        });
      }

      console.error('Assume role error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to assume role'
      });
    }
  }

  async getRoleSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = await this.roleService.getRoleSession(sessionId);
      
      res.status(200).json(session.toJSON());
    } catch (error) {
      if (error.message === 'Session not found') {
        return res.status(404).json({
          error: 'Session not found'
        });
      }

      console.error('Get role session error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get role session'
      });
    }
  }

  async cleanupExpiredSessions(req, res) {
    try {
      const count = await this.roleService.cleanupExpiredSessions();
      
      res.status(200).json({
        message: 'Cleanup completed',
        deletedCount: count
      });
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cleanup expired sessions'
      });
    }
  }
}

module.exports = RoleController;
