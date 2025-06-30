/**
 * @swagger
 * tags:
 *   name: Policies
 *   description: Policy management operations
 */

/**
 * @swagger
 * /api/v1/policies:
 *   post:
 *     summary: Create a new policy
 *     tags: [Policies]
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
 *               - document
 *             properties:
 *               name:
 *                 type: string
 *                 example: "S3ReadOnlyPolicy"
 *               description:
 *                 type: string
 *                 example: "Allows read-only access to S3 buckets"
 *               path:
 *                 type: string
 *                 example: "/"
 *               document:
 *                 type: object
 *                 example:
 *                   Version: "2012-10-17"
 *                   Statement:
 *                     - Effect: "Allow"
 *                       Action: ["s3:GetObject", "s3:ListBucket"]
 *                       Resource: "*"
 *               type:
 *                 type: string
 *                 enum: [AWS, Custom, Inline]
 *                 example: "Custom"
 *     responses:
 *       201:
 *         description: Policy created successfully
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "policy-123"
 *                     name:
 *                       type: string
 *                       example: "S3ReadOnlyPolicy"
 *                     arn:
 *                       type: string
 *                       example: "arn:aws:iam::account-456:policy/S3ReadOnlyPolicy"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/policies:
 *   get:
 *     summary: List all policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policies retrieved successfully
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
 * /api/v1/policies/default:
 *   get:
 *     summary: Get default policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default policies retrieved successfully
 */

/**
 * @swagger
 * /api/v1/policies/{policyId}:
 *   get:
 *     summary: Get policy by ID
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *     responses:
 *       200:
 *         description: Policy retrieved successfully
 *       404:
 *         description: Policy not found
 *   put:
 *     summary: Update policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "S3ReadOnlyPolicy"
 *               description:
 *                 type: string
 *                 example: "Allows read-only access to S3 buckets"
 *               document:
 *                 type: object
 *                 example:
 *                   Version: "2012-10-17"
 *                   Statement:
 *                     - Effect: "Allow"
 *                       Action: ["s3:GetObject", "s3:ListBucket"]
 *                       Resource: "*"
 *     responses:
 *       200:
 *         description: Policy updated successfully
 *       404:
 *         description: Policy not found
 *   delete:
 *     summary: Delete policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Policy deleted successfully
 *       404:
 *         description: Policy not found
 */

/**
 * @swagger
 * /api/v1/policies/{policyId}/attach-user:
 *   post:
 *     summary: Attach policy to user
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user-123"
 *     responses:
 *       200:
 *         description: Policy attached to user successfully
 *       404:
 *         description: Policy or user not found
 */

/**
 * @swagger
 * /api/v1/policies/{policyId}/attach-group:
 *   post:
 *     summary: Attach policy to group
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: string
 *                 example: "group-123"
 *     responses:
 *       200:
 *         description: Policy attached to group successfully
 *       404:
 *         description: Policy or group not found
 */

/**
 * @swagger
 * /api/v1/policies/{policyId}/detach-user/{userId}:
 *   delete:
 *     summary: Detach policy from user
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Policy detached from user successfully
 *       404:
 *         description: Policy or user not found
 */

/**
 * @swagger
 * /api/v1/policies/{policyId}/detach-group/{groupId}:
 *   delete:
 *     summary: Detach policy from group
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Policy ID
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Policy detached from group successfully
 *       404:
 *         description: Policy or group not found
 */

/**
 * @swagger
 * /api/v1/policies/users/{userId}/policies:
 *   get:
 *     summary: Get user policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User policies retrieved successfully
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
 * /api/v1/policies/groups/{groupId}/policies:
 *   get:
 *     summary: Get group policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group policies retrieved successfully
 */

/**
 * @swagger
 * /api/v1/policies/validate:
 *   post:
 *     summary: Validate policy document
 *     tags: [Policies]
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
 *                       Action: ["s3:GetObject"]
 *                       Resource: "*"
 *     responses:
 *       200:
 *         description: Policy document is valid
 *       400:
 *         description: Policy document is invalid
 */

const { PolicyService } = require('../services/PolicyService');

class PolicyController {
  constructor() {
    this.policyService = new PolicyService();
  }

  /**
   * Creates a new policy
   */
  async createPolicy(req, res) {
    try {
      const { accountId } = req.user; // From JWT token
      const { name, description, path, document, type } = req.body;

      if (!name || !document) {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['Policy name and document are required']
        });
      }

      const policyData = {
        accountId,
        name,
        description,
        path,
        document,
        type
      };

      const policy = await this.policyService.createPolicy(policyData);

      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        policy: policy.toJSON()
      });
    } catch (error) {
      if (error.code === 'POLICY_NAME_EXISTS') {
        return res.status(409).json({
          error: 'Policy name already exists',
          details: [error.message]
        });
      }

      if (error.details) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      console.error('Policy creation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create policy'
      });
    }
  }

  /**
   * Gets a policy by ID
   */
  async getPolicy(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId } = req.params;

      const policy = await this.policyService.getPolicyById(policyId, accountId);

      if (!policy) {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      res.json({
        success: true,
        policy: policy.toJSON()
      });
    } catch (error) {
      console.error('Get policy error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get policy'
      });
    }
  }

  /**
   * Lists policies for the account
   */
  async listPolicies(req, res) {
    try {
      const { accountId } = req.user;
      const { 
        limit = 50, 
        offset = 0, 
        pathPrefix,
        type 
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      if (pathPrefix) options.pathPrefix = pathPrefix;
      if (type) options.type = type;

      const result = await this.policyService.listPolicies(accountId, options);

      res.json({
        success: true,
        policies: result.policies.map(policy => policy.toJSON()),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pagination: {
          limit: options.limit,
          offset: options.offset
        }
      });
    } catch (error) {
      console.error('List policies error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list policies'
      });
    }
  }

  /**
   * Updates a policy
   */
  async updatePolicy(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId } = req.params;
      const { name, description, path, document, type } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (path !== undefined) updateData.path = path;
      if (document !== undefined) updateData.document = document;
      if (type !== undefined) updateData.type = type;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update'
        });
      }

      const policy = await this.policyService.updatePolicy(policyId, accountId, updateData);

      res.json({
        success: true,
        message: 'Policy updated successfully',
        policy: policy.toJSON()
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND') {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      if (error.code === 'POLICY_NAME_EXISTS') {
        return res.status(409).json({
          error: 'Policy name already exists',
          details: [error.message]
        });
      }

      if (error.details) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      console.error('Update policy error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update policy'
      });
    }
  }

  /**
   * Deletes a policy
   */
  async deletePolicy(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId } = req.params;

      await this.policyService.deletePolicy(policyId, accountId);

      res.json({
        success: true,
        message: 'Policy deleted successfully'
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND') {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      if (error.code === 'POLICY_IN_USE') {
        return res.status(409).json({
          error: 'Policy is in use',
          message: 'Cannot delete policy that is attached to users or groups',
          details: error.details
        });
      }

      console.error('Delete policy error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete policy'
      });
    }
  }

  /**
   * Attaches a policy to a user
   */
  async attachPolicyToUser(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      const result = await this.policyService.attachPolicyToUser(policyId, userId, accountId);

      res.json({
        success: true,
        message: result.message,
        attachment: result.attachment
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND') {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      if (error.code === 'POLICY_ALREADY_ATTACHED') {
        return res.status(409).json({
          error: 'Policy already attached',
          details: [error.message]
        });
      }

      console.error('Attach policy to user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to attach policy to user'
      });
    }
  }

  /**
   * Attaches a policy to a group
   */
  async attachPolicyToGroup(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId } = req.params;
      const { groupId } = req.body;

      if (!groupId) {
        return res.status(400).json({
          error: 'Group ID is required'
        });
      }

      const result = await this.policyService.attachPolicyToGroup(policyId, groupId, accountId);

      res.json({
        success: true,
        message: result.message,
        attachment: result.attachment
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND') {
        return res.status(404).json({
          error: 'Policy not found'
        });
      }

      if (error.code === 'POLICY_ALREADY_ATTACHED') {
        return res.status(409).json({
          error: 'Policy already attached',
          details: [error.message]
        });
      }

      console.error('Attach policy to group error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to attach policy to group'
      });
    }
  }

  /**
   * Detaches a policy from a user
   */
  async detachPolicyFromUser(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId, userId } = req.params;

      await this.policyService.detachPolicyFromUser(policyId, userId, accountId);

      res.json({
        success: true,
        message: 'Policy detached from user successfully'
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_ATTACHED') {
        return res.status(404).json({
          error: 'Policy not attached to user'
        });
      }

      console.error('Detach policy from user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to detach policy from user'
      });
    }
  }

  /**
   * Detaches a policy from a group
   */
  async detachPolicyFromGroup(req, res) {
    try {
      const { accountId } = req.user;
      const { policyId, groupId } = req.params;

      await this.policyService.detachPolicyFromGroup(policyId, groupId, accountId);

      res.json({
        success: true,
        message: 'Policy detached from group successfully'
      });
    } catch (error) {
      if (error.code === 'POLICY_NOT_ATTACHED') {
        return res.status(404).json({
          error: 'Policy not attached to group'
        });
      }

      console.error('Detach policy from group error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to detach policy from group'
      });
    }
  }

  /**
   * Gets all policies for a user
   */
  async getUserPolicies(req, res) {
    try {
      const { accountId } = req.user;
      const { userId } = req.params;

      const policies = await this.policyService.getUserPolicies(userId, accountId);

      res.json({
        success: true,
        policies: policies.map(policy => policy.toJSON()),
        count: policies.length
      });
    } catch (error) {
      console.error('Get user policies error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user policies'
      });
    }
  }

  /**
   * Gets all policies for a group
   */
  async getGroupPolicies(req, res) {
    try {
      const { accountId } = req.user;
      const { groupId } = req.params;

      const policies = await this.policyService.getGroupPolicies(groupId, accountId);

      res.json({
        success: true,
        policies: policies.map(policy => policy.toJSON()),
        count: policies.length
      });
    } catch (error) {
      console.error('Get group policies error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get group policies'
      });
    }
  }

  /**
   * Gets default system policies
   */
  async getDefaultPolicies(req, res) {
    try {
      const policies = await this.policyService.getDefaultPolicies();

      res.json({
        success: true,
        policies: policies.map(policy => policy.toJSON()),
        count: policies.length
      });
    } catch (error) {
      console.error('Get default policies error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get default policies'
      });
    }
  }

  /**
   * Validates a policy document
   */
  async validatePolicyDocument(req, res) {
    try {
      const { document } = req.body;

      if (!document) {
        return res.status(400).json({
          error: 'Policy document is required'
        });
      }

      const validation = this.policyService.validatePolicyDocument(document);

      res.json({
        success: true,
        valid: validation.isValid,
        errors: validation.errors
      });
    } catch (error) {
      console.error('Validate policy document error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate policy document'
      });
    }
  }
}

module.exports = PolicyController;
