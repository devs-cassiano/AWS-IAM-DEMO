/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and authorization operations
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@company.com"
 *               password:
 *                 type: string
 *                 example: "SecurePassword123!"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresIn:
 *                       type: number
 *                       example: 3600
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     expiresIn:
 *                       type: number
 *                       example: 3600
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and invalidate tokens
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Logout user by invalidating both access and refresh tokens.
 *       Access token should be provided in Authorization header, refresh token in request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: "Logout successful"
 */

/**
 * @swagger
 * /api/v1/auth/validate:
 *   post:
 *     summary: Validate access token
 *     description: |
 *       Validates an access token provided via Authorization header (Bearer token).
 *       The token must be sent in the Authorization header with the format: Bearer <token>
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: "user123"
 *                         accountId:
 *                           type: string
 *                           example: "acc456"
 *                         username:
 *                           type: string
 *                           example: "john.doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@company.com"
 *                         isRoot:
 *                           type: boolean
 *                           example: false
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *       400:
 *         description: Authorization header is required or has invalid format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_header:
 *                 summary: Missing Authorization header
 *                 value:
 *                   success: false
 *                   error: "Authorization header is required"
 *               invalid_format:
 *                 summary: Invalid header format
 *                 value:
 *                   success: false
 *                   error: "Invalid Authorization header format. Expected: Bearer <token>"
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               data:
 *                 valid: false
 *               error: "Invalid or expired token"
 */

/**
 * @swagger
 * /api/v1/auth/login-iam:
 *   post:
 *     summary: Login with IAM credentials (accountId + username + password)
 *     description: Login for IAM users using account ID, username, and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - username
 *               - password
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: "ACC-001"
 *               username:
 *                 type: string
 *                 example: "john.doe"
 *               password:
 *                 type: string
 *                 example: "GeneratedPassword123!"
 *     responses:
 *       200:
 *         description: IAM login successful
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
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "IAM login successful"
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: User account is not active
 *       500:
 *         description: Internal server error
 */

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Login with email and password
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await this.authService.loginWithCredentials(email, password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      if (error.message.includes('Invalid credentials') || error.message.includes('User not found')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        data: { tokens },
        message: 'Tokens refreshed successfully'
      });
    } catch (error) {
      if (error.message.includes('Invalid refresh token') || 
          error.message.includes('User not found') ||
          error.message.includes('User is inactive')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      
      // Pegar o access token do header Authorization
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : null;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Capturar informações para auditoria
      const logoutOptions = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      const result = await this.authService.logout(accessToken, refreshToken, logoutOptions);

      res.status(200).json({
        success: true,
        message: result.message,
        method: result.method,
        tokensRevoked: result.tokensRevoked
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate access token
   */
  async validateToken(req, res) {
    try {
      // Get token from Authorization header only
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(400).json({
          success: false,
          error: 'Authorization header is required'
        });
      }
      
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(400).json({
          success: false,
          error: 'Invalid Authorization header format. Expected: Bearer <token>'
        });
      }
      
      const accessToken = parts[1];

      const payload = await this.authService.verifyAccessToken(accessToken);

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: {
            userId: payload.userId,
            accountId: payload.accountId,
            username: payload.username,
            email: payload.email,
            isRoot: payload.isRoot
          }
        },
        message: 'Token is valid'
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        data: { valid: false },
        error: 'Invalid or expired token'
      });
    }
  }

  /**
   * Obter estatísticas da blacklist (admin endpoint)
   */
  async getBlacklistStats(req, res) {
    try {
      const stats = await this.authService.getBlacklistStats();
      
      if (!stats) {
        return res.status(503).json({
          success: false,
          error: 'Blacklist stats not available'
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AuthController.getBlacklistStats error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Revogar todos os tokens de um usuário (admin endpoint)
   */
  async revokeAllUserTokens(req, res) {
    try {
      const { userId } = req.params;
      const { reason = 'admin_action' } = req.body;
      const { accountId } = req.user;

      const result = await this.authService.revokeAllUserTokens(
        userId, 
        accountId, 
        reason,
        {
          adminUserId: req.user.userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.status(200).json({
        success: true,
        message: `All tokens revoked for user ${userId}`,
        data: result
      });
    } catch (error) {
      console.error('AuthController.revokeAllUserTokens error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Login with IAM credentials (accountId + username + password)
   * For IAM users (non-root users)
   */
  async loginIAM(req, res) {
    try {
      const { accountId, username, password } = req.body;

      if (!accountId || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Account ID, username, and password are required'
        });
      }

      const result = await this.authService.loginWithIAMCredentials(accountId, username, password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'IAM login successful'
      });
    } catch (error) {
      if (error.message.includes('Invalid credentials') || error.message.includes('User not found')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      if (error.message.includes('inactive') || error.message.includes('suspended')) {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = { AuthController };
