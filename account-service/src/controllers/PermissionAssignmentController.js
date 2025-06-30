const { PolicyService } = require('../services/PolicyService');
const { UserService } = require('../services/UserService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * tags:
 *   name: Permission Assignment
 *   description: Permission assignment operations for users and roles
 */

/**
 * @swagger
 * /api/v1/permissions/assign-role:
 *   post:
 *     summary: Assign role to user
 *     tags: [Permission Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to assign role to
 *                 example: "user-123"
 *               roleId:
 *                 type: string
 *                 description: Role ID to assign
 *                 example: "role-456"
 *     responses:
 *       200:
 *         description: Role assigned to user successfully
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
 *                   example: "Role assigned to user successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-123"
 *                         username:
 *                           type: string
 *                           example: "john.doe"
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "role-456"
 *                         name:
 *                           type: string
 *                           example: "AdminRole"
 *       404:
 *         description: User or role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Role already assigned to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/remove-role:
 *   post:
 *     summary: Remove role from user
 *     tags: [Permission Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - roleId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to remove role from
 *                 example: "user-123"
 *               roleId:
 *                 type: string
 *                 description: Role ID to remove
 *                 example: "role-456"
 *     responses:
 *       200:
 *         description: Role removed from user successfully
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
 *                   example: "Role removed from user successfully"
 *       404:
 *         description: User, role, or assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/attach-policy-to-role:
 *   post:
 *     summary: Attach policy to role
 *     tags: [Permission Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - policyId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to attach policy to
 *                 example: "role-456"
 *               policyId:
 *                 type: string
 *                 description: Policy ID to attach
 *                 example: "policy-789"
 *     responses:
 *       200:
 *         description: Policy attached to role successfully
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
 *                   example: "Policy attached to role successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "role-456"
 *                         name:
 *                           type: string
 *                           example: "AdminRole"
 *                     policy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "policy-789"
 *                         name:
 *                           type: string
 *                           example: "S3FullAccess"
 *       404:
 *         description: Role or policy not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Policy already attached to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/permissions/detach-policy-from-role:
 *   post:
 *     summary: Detach policy from role
 *     tags: [Permission Assignment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - policyId
 *             properties:
 *               roleId:
 *                 type: string
 *                 description: Role ID to detach policy from
 *                 example: "role-456"
 *               policyId:
 *                 type: string
 *                 description: Policy ID to detach
 *                 example: "policy-789"
 *     responses:
 *       200:
 *         description: Policy detached from role successfully
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
 *                   example: "Policy detached from role successfully"
 *       404:
 *         description: Role, policy, or attachment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * Permission Assignment Controller
 * Handles assigning policies to users, groups, and roles
 */
class PermissionAssignmentController {
  constructor() {
    this.policyService = new PolicyService(
      repositoryFactory.createPolicyRepository(),
      repositoryFactory.createPolicyAttachmentRepository()
    );
    this.userService = new UserService(repositoryFactory.createUserRepository(), bcrypt);
  }

  /**
   * Assign policy to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async assignPolicyToUser(req, res) {
    try {
      const { accountId } = req.user;
      const { userId, policyId } = req.params;

      // Verify user exists and belongs to account
      const user = await this.userService.getUserById(userId);
      if (!user || user.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify policy exists and belongs to account
      const policy = await this.policyService.getPolicyById(policyId);
      if (!policy || policy.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'Policy not found'
        });
      }

      // Assign policy to user
      await this.policyService.attachPolicyToUser(userId, policyId);

      res.json({
        success: true,
        message: `Policy "${policy.name}" assigned to user "${user.username}"`,
        data: {
          user: {
            id: user.id,
            username: user.username
          },
          policy: {
            id: policy.id,
            name: policy.name,
            description: policy.description
          }
        }
      });

    } catch (error) {
      console.error('Error assigning policy to user:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove policy from user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async removePolicyFromUser(req, res) {
    try {
      const { accountId } = req.user;
      const { userId, policyId } = req.params;

      // Verify user exists and belongs to account
      const user = await this.userService.getUserById(userId);
      if (!user || user.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify policy exists and belongs to account
      const policy = await this.policyService.getPolicyById(policyId);
      if (!policy || policy.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'Policy not found'
        });
      }

      // Remove policy from user
      await this.policyService.detachPolicyFromUser(userId, policyId);

      res.json({
        success: true,
        message: `Policy "${policy.name}" removed from user "${user.username}"`,
        data: {
          user: {
            id: user.id,
            username: user.username
          },
          policy: {
            id: policy.id,
            name: policy.name
          }
        }
      });

    } catch (error) {
      console.error('Error removing policy from user:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all policies assigned to a user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserPolicies(req, res) {
    try {
      const { accountId } = req.user;
      const { userId } = req.params;

      // Verify user exists and belongs to account
      const user = await this.userService.getUserById(userId);
      if (!user || user.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get user policies
      const policies = await this.policyService.getUserPolicies(userId);

      // Parse policy documents to show permissions
      const policiesWithPermissions = policies.map(policy => {
        const policyData = policy.toJSON();
        
        let permissions = null;
        try {
          const document = typeof policy.document === 'string' 
            ? JSON.parse(policy.document) 
            : policy.document;
            
          if (document.Statement && document.Statement.length > 0) {
            const statement = document.Statement[0];
            permissions = {
              effect: statement.Effect,
              actions: statement.Action,
              resources: statement.Resource,
              conditions: statement.Condition || null
            };
          }
        } catch (e) {
          console.warn('Error parsing policy document:', e);
        }
        
        return {
          ...policyData,
          permissions
        };
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username
          },
          policiesCount: policiesWithPermissions.length,
          policies: policiesWithPermissions
        }
      });

    } catch (error) {
      console.error('Error getting user policies:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Bulk assign multiple policies to a user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async bulkAssignPoliciesToUser(req, res) {
    try {
      const { accountId } = req.user;
      const { userId } = req.params;
      const { policyIds } = req.body;

      if (!Array.isArray(policyIds) || policyIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'policyIds must be a non-empty array'
        });
      }

      // Verify user exists and belongs to account
      const user = await this.userService.getUserById(userId);
      if (!user || user.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const results = [];
      const errors = [];

      // Process each policy
      for (const policyId of policyIds) {
        try {
          // Verify policy exists and belongs to account
          const policy = await this.policyService.getPolicyById(policyId);
          if (!policy || policy.accountId !== accountId) {
            errors.push({
              policyId,
              error: 'Policy not found'
            });
            continue;
          }

          // Assign policy to user
          await this.policyService.attachPolicyToUser(userId, policyId);
          
          results.push({
            policyId: policy.id,
            policyName: policy.name,
            status: 'assigned'
          });

        } catch (error) {
          errors.push({
            policyId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk assignment completed for user "${user.username}"`,
        data: {
          user: {
            id: user.id,
            username: user.username
          },
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors
        }
      });

    } catch (error) {
      console.error('Error bulk assigning policies to user:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create and assign a custom policy to user in one step
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createAndAssignPolicy(req, res) {
    try {
      const { accountId } = req.user;
      const { userId } = req.params;
      const {
        policyName,
        description,
        service,
        actions,
        resources,
        conditions,
        effect = 'Allow'
      } = req.body;

      // Verify user exists and belongs to account
      const user = await this.userService.getUserById(userId);
      if (!user || user.accountId !== accountId) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Validate required fields
      if (!policyName || !service || !actions || !resources) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: policyName, service, actions, resources'
        });
      }

      // Build policy document
      const policyDocument = {
        Version: '2012-10-17',
        Statement: [{
          Effect: effect,
          Action: Array.isArray(actions) ? actions : [actions],
          Resource: Array.isArray(resources) ? resources : [resources]
        }]
      };

      if (conditions && Object.keys(conditions).length > 0) {
        policyDocument.Statement[0].Condition = conditions;
      }

      // Create policy
      const policy = await this.policyService.createPolicy({
        accountId,
        name: policyName,
        description: description || `Custom policy for user ${user.username}`,
        document: policyDocument
      });

      // Assign policy to user
      await this.policyService.attachPolicyToUser(userId, policy.id);

      res.status(201).json({
        success: true,
        message: `Custom policy "${policyName}" created and assigned to user "${user.username}"`,
        data: {
          user: {
            id: user.id,
            username: user.username
          },
          policy: policy.toJSON(),
          permissions: {
            service,
            actions: policyDocument.Statement[0].Action,
            resources: policyDocument.Statement[0].Resource,
            effect,
            conditions: conditions || null
          }
        }
      });

    } catch (error) {
      console.error('Error creating and assigning policy:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = { PermissionAssignmentController };
