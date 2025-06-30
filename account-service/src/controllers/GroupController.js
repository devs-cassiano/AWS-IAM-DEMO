/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management operations
 */

const GroupService = require('../services/GroupService');

class GroupController {
  constructor() {
    this.groupService = new GroupService();
  }

  /**
   * Creates a new group
   */
  async createGroup(req, res) {
    try {
      const { accountId } = req.user; // From JWT token
      const { name, description, path } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['Group name is required']
        });
      }

      const group = await this.groupService.createGroup({
        accountId,
        name,
        description,
        path: path || '/'
      });

      res.status(201).json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('GroupController.createGroup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: [error.message]
      });
    }
  }

  /**
   * List all groups for account
   */
  async listGroups(req, res) {
    try {
      const { accountId } = req.user;
      const groups = await this.groupService.listGroups(accountId);

      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('GroupController.listGroups error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { accountId } = req.user;

      const group = await this.groupService.getGroupById(groupId, accountId);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found'
        });
      }

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('GroupController.getGroup error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update group
   */
  async updateGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { accountId } = req.user;
      const updateData = req.body;

      const group = await this.groupService.updateGroup(groupId, accountId, updateData);

      if (!group) {
        return res.status(404).json({
          error: 'Group not found'
        });
      }

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('GroupController.updateGroup error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete group
   */
  async deleteGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { accountId } = req.user;

      const deleted = await this.groupService.deleteGroup(groupId, accountId);

      if (!deleted) {
        return res.status(404).json({
          error: 'Group not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error) {
      console.error('GroupController.deleteGroup error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Add user to group
   */
  async addUserToGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { userId } = req.body;
      const { accountId } = req.user;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required'
        });
      }

      await this.groupService.addUserToGroup(groupId, userId, accountId);

      res.status(200).json({
        success: true,
        message: 'User added to group successfully'
      });
    } catch (error) {
      console.error('GroupController.addUserToGroup error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(req, res) {
    try {
      const { groupId, userId } = req.params;
      const { accountId } = req.user;

      await this.groupService.removeUserFromGroup(groupId, userId, accountId);

      res.status(200).json({
        success: true,
        message: 'User removed from group successfully'
      });
    } catch (error) {
      console.error('GroupController.removeUserFromGroup error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get users in group
   */
  async getGroupUsers(req, res) {
    try {
      const { groupId } = req.params;
      const { accountId } = req.user;

      const users = await this.groupService.getGroupUsers(groupId, accountId);

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('GroupController.getGroupUsers error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get user's groups
   */
  async getUserGroups(req, res) {
    try {
      const { userId } = req.params;
      const { accountId } = req.user;

      const groups = await this.groupService.getUserGroups(userId, accountId);

      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('GroupController.getUserGroups error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

/**
 * @swagger
 * /api/v1/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Developers"
 *               description:
 *                 type: string
 *                 example: "Development team group"
 *               path:
 *                 type: string
 *                 example: "/"
 *     responses:
 *       201:
 *         description: Group created successfully
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
 *                       example: "group-123"
 *                     name:
 *                       type: string
 *                       example: "Developers"
 *                     description:
 *                       type: string
 *                       example: "Development team group"
 *                     path:
 *                       type: string
 *                       example: "/"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: List all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
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
 * /api/v1/groups/{groupId}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
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
 *         description: Group retrieved successfully
 *       404:
 *         description: Group not found
 *   put:
 *     summary: Update group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Group Name"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
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
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/users:
 *   post:
 *     summary: Add user to group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: User added to group successfully
 *       404:
 *         description: Group or user not found
 *   get:
 *     summary: Get users in group
 *     tags: [Groups]
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
 *         description: Group users retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/users/{userId}:
 *   delete:
 *     summary: Remove user from group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User removed from group successfully
 *       404:
 *         description: Group or user not found
 */

/**
 * @swagger
 * /api/v1/groups/users/{userId}/groups:
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
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
 *         description: User groups retrieved successfully
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

module.exports = GroupController;
