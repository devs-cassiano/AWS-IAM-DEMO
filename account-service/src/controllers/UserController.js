/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users from authenticated user's account
 *     description: Retrieves all users belonging to the account specified by the JWT token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *       400:
 *         description: Account ID not found in token
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user in the account specified by the JWT token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john.doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john.doe.updated"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.updated@example.com"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted successfully
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
 *                   example: "User deleted successfully"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/users/{userId}/password:
 *   put:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldPassword123!"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: "Password updated successfully"
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * UserController class for handling user-related HTTP requests
 * Provides REST API endpoints for user management
 */
class UserController {
  /**
   * Creates a new UserController instance
   * @param {Object} userService - User service instance
   */
  constructor(userService) {
    this.userService = userService;
  }

  /**
   * Creates a new user
   * POST /users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Get accountId from authenticated user's token
      if (req.user && req.user.accountId) {
        userData.accountId = req.user.accountId;
      } else {
        console.error('CreateUser: Missing accountId from token. req.user:', req.user);
        return res.status(400).json({
          success: false,
          error: 'Account ID required'
        });
      }
      
      const result = await this.userService.createUser(userData);

      // Prepare response data
      const responseData = {
        user: result.user.toJSON()
      };

      // Include generated password for IAM users (non-root)
      if (result.generatedPassword && !result.user.isRoot) {
        responseData.generatedPassword = result.generatedPassword;
        responseData.loginInfo = {
          accountId: result.user.accountId,
          username: result.user.username,
          password: result.generatedPassword
        };
      }

      res.status(201).json({
        success: true,
        data: responseData,
        message: result.generatedPassword ? 
          'IAM user created successfully. Save the generated password - it cannot be retrieved later.' : 
          'User created successfully'
      });
    } catch (error) {
      console.error('UserController.createUser error:', error);

      // Handle specific error types
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('must be') || 
          error.message.includes('required') || 
          error.message.includes('invalid')) {
        return res.status(400).json({
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
   * Gets a user by ID
   * GET /users/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: result.toJSON()
      });
    } catch (error) {
      console.error('UserController.getUserById error:', error);

      if (error.message === 'User not found') {
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
   * Gets all users for a specific account
   * GET /accounts/:accountId/users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUsersByAccountId(req, res) {
    try {
      const { accountId } = req.params;
      const result = await this.userService.getUsersByAccountId(accountId);

      res.status(200).json({
        success: true,
        data: result.map(user => user.toJSON())
      });
    } catch (error) {
      console.error('UserController.getUsersByAccountId error:', error);

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Updates a user
   * PUT /users/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const result = await this.userService.updateUser(id, updateData, req.user);

      res.status(200).json({
        success: true,
        data: result.toJSON(),
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('UserController.updateUser error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('must be') || 
          error.message.includes('required') || 
          error.message.includes('invalid')) {
        return res.status(400).json({
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
   * Updates a user's password
   * PUT /users/:id/password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      
      const result = await this.userService.updateUserPassword(id, oldPassword, newPassword);

      res.status(200).json({
        success: true,
        data: result.toJSON(),
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('UserController.updateUserPassword error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message.includes('password') || 
          error.message.includes('incorrect') ||
          error.message.includes('must be')) {
        return res.status(400).json({
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
   * Deletes a user
   * DELETE /users/:id
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('UserController.deleteUser error:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      if (error.message === 'Cannot delete root user') {
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
   * Authenticates a user with email and password
   * POST /auth/login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async authenticateUser(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await this.userService.authenticateUser(email, password);

      if (!result) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      res.status(200).json({
        success: true,
        data: result.toJSON(),
        message: 'Authentication successful'
      });
    } catch (error) {
      console.error('UserController.authenticateUser error:', error);

      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Gets all users from the authenticated user's account (from token)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUsersFromToken(req, res) {
    try {
      if (!req.user || !req.user.accountId) {
        return res.status(400).json({
          success: false,
          error: 'Account ID not found in token'
        });
      }

      const users = await this.userService.getUsersByAccountId(req.user.accountId);

      res.json({
        success: true,
        data: users.map(user => user.toJSON()),
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      console.error('UserController.getUsersFromToken error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/v1/users/roles:
   *   get:
   *     summary: Get roles assigned to the current authenticated user
   *     description: Retrieves all roles assigned to the currently authenticated user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User roles retrieved successfully
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
   *                     userId:
   *                       type: string
   *                       format: uuid
   *                       example: "d5c86085-d938-425f-afc2-4616ea470366"
   *                     username:
   *                       type: string
   *                       example: "root"
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             format: uuid
   *                             example: "550e8400-e29b-41d4-a716-446655440000"
   *                           name:
   *                             type: string
   *                             example: "root"
   *                           description:
   *                             type: string
   *                             example: "Full system administrator role"
   *                           type:
   *                             type: string
   *                             example: "system"
   *                           assignedAt:
   *                             type: string
   *                             format: date-time
   *                           assignedBy:
   *                             type: string
   *                             example: "system"
   *                 message:
   *                   type: string
   *                   example: "User roles retrieved successfully"
   *       401:
  /**
   * @swagger
   * /api/v1/users/roles:
   *   get:
   *     summary: Get roles assigned to the current authenticated user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User roles retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserRolesResponse'
   *       401:
   *         description: Unauthorized - invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  /**
   * Get roles assigned to the current authenticated user
   */
  async getCurrentUserRoles(req, res) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({
          success: false,
          error: 'User ID not found in token'
        });
      }

      const { repositoryFactory } = require('../repositories/RepositoryFactory');
      const userRoleRepository = repositoryFactory.createUserRoleRepository();
      
      const userRoles = await userRoleRepository.findByUserId(req.user.userId);

      res.json({
        success: true,
        data: {
          userId: req.user.userId,
          username: req.user.username,
          roles: userRoles.map(role => ({
            id: role.role_id,
            name: role.role_name,
            description: role.role_description,
            assignedAt: role.assigned_at,
            assignedBy: role.assigned_by
          }))
        },
        message: 'User roles retrieved successfully'
      });
    } catch (error) {
      console.error('UserController.getCurrentUserRoles error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = { UserController };
