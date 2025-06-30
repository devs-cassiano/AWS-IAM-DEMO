const { repositoryFactory } = require('../repositories/RepositoryFactory');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management operations
 */

/**
 * @swagger
 * /api/v1/permissions:
 *   post:
 *     summary: Create a new permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service
 *               - action
 *             properties:
 *               service:
 *                 type: string
 *                 description: AWS service name
 *                 example: "s3"
 *               action:
 *                 type: string
 *                 description: Specific action
 *                 example: "s3:GetObject"
 *               resourcePattern:
 *                 type: string
 *                 description: Resource pattern or ARN
 *                 example: "arn:aws:s3:::test-bucket/*"
 *                 default: "*"
 *               effect:
 *                 type: string
 *                 enum: [Allow, Deny]
 *                 description: Permission effect
 *                 example: "Allow"
 *                 default: "Allow"
 *               conditions:
 *                 type: object
 *                 description: IAM condition block
 *                 example: {}
 *                 default: {}
 *               description:
 *                 type: string
 *                 description: Human-readable description
 *                 example: "Allow reading objects from test bucket"
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: "Permission created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Permission already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Get all permissions for current account
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service name
 *         example: "s3"
 *       - in: query
 *         name: effect
 *         schema:
 *           type: string
 *           enum: [Allow, Deny]
 *         description: Filter by effect
 *         example: "Allow"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of permissions to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of permissions to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Permission'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     offset:
 *                       type: integer
 *                       example: 0
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *         example: "perm-123"
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   put:
 *     summary: Update permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *         example: "perm-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resourcePattern:
 *                 type: string
 *                 description: Resource pattern or ARN
 *                 example: "arn:aws:s3:::updated-bucket/*"
 *               effect:
 *                 type: string
 *                 enum: [Allow, Deny]
 *                 description: Permission effect
 *                 example: "Deny"
 *               conditions:
 *                 type: object
 *                 description: IAM condition block
 *                 example: {"StringEquals": {"aws:RequestedRegion": "us-east-1"}}
 *               description:
 *                 type: string
 *                 description: Human-readable description
 *                 example: "Updated permission description"
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: "Permission updated successfully"
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cannot update system permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *         example: "perm-123"
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Permission deleted successfully"
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Cannot delete system permission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/{id}/attach-policy:
 *   post:
 *     summary: Attach permission to policy
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *         example: "perm-123"
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
 *                 description: Policy ID to attach permission to
 *                 example: "policy-456"
 *     responses:
 *       200:
 *         description: Permission attached to policy successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Permission attached to policy successfully"
 *       404:
 *         description: Permission or policy not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Permission already attached to policy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/{id}/detach-policy:
 *   post:
 *     summary: Detach permission from policy
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *         example: "perm-123"
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
 *                 description: Policy ID to detach permission from
 *                 example: "policy-456"
 *     responses:
 *       200:
 *         description: Permission detached from policy successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Permission detached from policy successfully"
 *       404:
 *         description: Permission, policy, or attachment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/policies/{policyId}/permissions:
 *   get:
 *     summary: Get all permissions attached to a policy
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *         example: "policy-456"
 *     responses:
 *       200:
 *         description: Policy permissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Policy not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/roles/{roleId}/permissions:
 *   get:
 *     summary: Get all permissions for a role (through policies)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *         example: "role-789"
 *     responses:
 *       200:
 *         description: Role permissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/users/{userId}/permissions:
 *   get:
 *     summary: Get all permissions for a user (through roles and policies)
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "user-101"
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Permission'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/services:
 *   get:
 *     summary: Get permissions grouped by service
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Permission'
 *                   example:
 *                     s3:
 *                       - id: "perm-123"
 *                         action: "s3:GetObject"
 *                         resourcePattern: "*"
 *                     iam:
 *                       - id: "perm-124"
 *                         action: "iam:ListUsers"
 *                         resourcePattern: "*"
 */

/**
 * PermissionController class for handling permission management
 * Manages individual permissions that can be attached to policies
 */
class PermissionController {
  constructor() {
    this.permissionRepository = repositoryFactory.createPermissionRepository();
    this.policyRepository = repositoryFactory.createPolicyRepository();
  }

  /**
   * Create a new permission
   * POST /permissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createPermission(req, res) {
    try {
      const { 
        service, 
        action, 
        resourcePattern = '*', 
        effect = 'Allow', 
        conditions = {}, 
        description 
      } = req.body;

      if (!service || !action) {
        return res.status(400).json({
          success: false,
          error: 'Service and action are required'
        });
      }

      // Get accountId from authenticated user's token
      const accountId = req.user?.accountId;

      const permissionData = {
        accountId,
        service,
        action,
        resourcePattern,
        effect,
        conditions,
        description,
        isSystem: false
      };

      const permission = await this.permissionRepository.create(permissionData);

      res.status(201).json({
        success: true,
        data: permission,
        message: 'Permission created successfully'
      });
    } catch (error) {
      console.error('PermissionController.createPermission error:', error);

      if (error.message.includes('unique')) {
        return res.status(409).json({
          success: false,
          error: 'Permission with this service, action, and resource pattern already exists'
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all permissions for current account
   * GET /permissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPermissions(req, res) {
    try {
      const accountId = req.user?.accountId;
      const { service } = req.query;

      let permissions;
      if (service) {
        permissions = await this.permissionRepository.findByService(service, accountId);
      } else {
        permissions = await this.permissionRepository.findByAccountId(accountId);
      }

      res.json({
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getPermissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permission by ID
   * GET /permissions/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPermissionById(req, res) {
    try {
      const { id } = req.params;
      const permission = await this.permissionRepository.findById(id);

      if (!permission) {
        return res.status(404).json({
          success: false,
          error: 'Permission not found'
        });
      }

      res.json({
        success: true,
        data: permission,
        message: 'Permission retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getPermissionById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update permission
   * PUT /permissions/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const permission = await this.permissionRepository.update(id, updateData);

      res.json({
        success: true,
        data: permission,
        message: 'Permission updated successfully'
      });
    } catch (error) {
      console.error('PermissionController.updatePermission error:', error);

      if (error.message === 'Permission not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete permission
   * DELETE /permissions/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deletePermission(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.permissionRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Permission not found'
        });
      }

      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      console.error('PermissionController.deletePermission error:', error);

      if (error.message === 'Cannot delete system permission') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Attach permission to policy
   * POST /permissions/:id/attach-policy
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async attachPermissionToPolicy(req, res) {
    try {
      const { id: permissionId } = req.params;
      const { policyId } = req.body;

      if (!policyId) {
        return res.status(400).json({
          success: false,
          error: 'Policy ID is required'
        });
      }

      const createdBy = req.user?.userId;
      const attachment = await this.permissionRepository.attachToPolicy(policyId, permissionId, createdBy);

      res.json({
        success: true,
        data: attachment,
        message: 'Permission attached to policy successfully'
      });
    } catch (error) {
      console.error('PermissionController.attachPermissionToPolicy error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Detach permission from policy
   * DELETE /permissions/:id/detach-policy/:policyId
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async detachPermissionFromPolicy(req, res) {
    try {
      const { id: permissionId, policyId } = req.params;

      const detached = await this.permissionRepository.detachFromPolicy(policyId, permissionId);

      if (!detached) {
        return res.status(404).json({
          success: false,
          error: 'Permission not attached to this policy'
        });
      }

      res.json({
        success: true,
        message: 'Permission detached from policy successfully'
      });
    } catch (error) {
      console.error('PermissionController.detachPermissionFromPolicy error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permissions attached to a policy
   * GET /policies/:policyId/permissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPolicyPermissions(req, res) {
    try {
      const { policyId } = req.params;
      const permissions = await this.permissionRepository.findByPolicyId(policyId);

      res.json({
        success: true,
        data: permissions,
        message: 'Policy permissions retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getPolicyPermissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permissions for a role (through policies)
   * GET /roles/:roleId/permissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRolePermissions(req, res) {
    try {
      const { roleId } = req.params;
      const permissions = await this.permissionRepository.findByRoleId(roleId);

      res.json({
        success: true,
        data: permissions,
        message: 'Role permissions retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getRolePermissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get permissions for a user (through roles and policies)
   * GET /users/:userId/permissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;
      const permissions = await this.permissionRepository.findByUserId(userId);

      res.json({
        success: true,
        data: permissions,
        message: 'User permissions retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getUserPermissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available permissions grouped by service
   * GET /permissions/services
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getServicePermissions(req, res) {
    try {
      const accountId = req.user?.accountId;
      const services = await this.permissionRepository.getServicePermissions(accountId);

      res.json({
        success: true,
        data: services,
        message: 'Service permissions retrieved successfully'
      });
    } catch (error) {
      console.error('PermissionController.getServicePermissions error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = { PermissionController };
