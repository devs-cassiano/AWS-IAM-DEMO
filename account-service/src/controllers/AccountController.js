/**
 * Controller for Account operations
 * Handles HTTP requests and responses for account management
 */

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management operations
 */

/**
 * @swagger
 * /api/v1/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Company"
 *                 description: "Company/Account name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@company.com"
 *                 description: "Root user email address"
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *                 description: "Root user password"
 *               rootUser:
 *                 type: object
 *                 description: "Optional root user details"
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: "admin"
 *                     description: "Root user username (optional, defaults to 'root')"
 *                   firstName:
 *                     type: string
 *                     example: "Admin"
 *                     description: "Root user first name"
 *                   lastName:
 *                     type: string
 *                     example: "User"
 *                     description: "Root user last name"
 *     responses:
 *       201:
 *         description: Account created successfully
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
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 *                     rootUser:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Account created successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
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
 *                     $ref: '#/components/schemas/Account'
 */

/**
 * @swagger
 * /api/v1/accounts/{accountId}:
 *   get:
 *     summary: Get account by ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Company Name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@company.com"
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "Account deleted successfully"
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

class AccountController {
  /**
   * Creates a new AccountController instance
   * @param {Object} accountService - Account service instance
   */
  constructor(accountService) {
    this.accountService = accountService;
  }

  /**
   * Creates a new account
   * POST /api/accounts
   */
  async createAccount(req, res) {
    try {
      // 1. Validate required fields
      const { name, email, password, rootUser = {} } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Name, email and password are required'
        });
      }

      // 2. Prepare account creation data with root user details
      const accountData = {
        name,
        email,
        password,
        // Merge root user details (optional)
        rootUser: {
          username: rootUser.username || 'root',
          firstName: rootUser.firstName || 'Root',
          lastName: rootUser.lastName || 'User',
          email, // Root user inherits account email
          ...rootUser // Allow any other root user properties
        }
      };
      
      // 3. Create account via service
      const result = await this.accountService.createAccount(accountData);

      // 3. Return success response
      res.status(201).json({
        success: true,
        data: {
          account: result.account.toJSON(),
          rootUser: result.rootUser.toJSON()
        },
        message: 'Account created successfully'
      });

    } catch (error) {
      
      // Handle business logic errors (validation, duplicate email, etc.)
      if (error.message.includes('required') || 
          error.message.includes('already registered') ||
          error.message.includes('must be') ||
          error.message.includes('Email must be valid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Gets all accounts with pagination
   * GET /api/accounts
   */
  async getAllAccounts(req, res) {
    try {
      // 1. Extract pagination parameters
      const { page, limit, search } = req.query;
      const options = {};
      
      if (page) options.page = page;
      if (limit) options.limit = limit;
      if (search) options.search = search;

      // 2. Get accounts from service
      const accounts = await this.accountService.getAllAccounts(options);

      // 3. Convert to JSON and add pagination info
      const accountsJson = accounts.map(account => account.toJSON());

      res.json({
        success: true,
        data: accountsJson,
        pagination: {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          total: accountsJson.length
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Gets account by ID
   * GET /api/accounts/:id
   */
  async getAccountById(req, res) {
    try {
      // 1. Extract account ID from params
      const { id } = req.params;

      // 2. Get account from service
      const account = await this.accountService.getAccountById(id);

      // 3. Return account data
      res.json({
        success: true,
        data: account.toJSON()
      });

    } catch (error) {
      // Handle not found errors
      if (error.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Updates an account
   * PUT /api/accounts/:id
   */
  async updateAccount(req, res) {
    try {
      // 1. Extract account ID and update data
      const { id } = req.params;
      const updateData = req.body;

      // 2. Update account via service
      const updatedAccount = await this.accountService.updateAccount(id, updateData);

      // 3. Validate that account was updated
      if (!updatedAccount) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update account - no data returned'
        });
      }

      // 4. Return updated account
      res.json({
        success: true,
        data: updatedAccount.toJSON ? updatedAccount.toJSON() : updatedAccount,
        message: 'Account updated successfully'
      });

    } catch (error) {
      // Handle not found errors
      if (error.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      // Handle validation errors
      if (error.message.includes('must be') || error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Deletes an account
   * DELETE /api/accounts/:id
   */
  async deleteAccount(req, res) {
    try {
      // 1. Extract account ID
      const { id } = req.params;

      // 2. Delete account via service
      await this.accountService.deleteAccount(id);

      // 3. Return success response
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      // Handle not found errors
      if (error.message === 'Account not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      // Handle unexpected errors
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = { AccountController };
