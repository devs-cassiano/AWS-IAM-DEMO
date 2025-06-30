const jwt = require('jsonwebtoken');
const { HybridTokenBlacklistService } = require('./HybridTokenBlacklistService');

class AuthService {
  constructor(userService, dbPool = null) {
    this.userService = userService;
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_EXPIRY || '1h';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    
    // Inicializar serviço híbrido de blacklist
    if (dbPool) {
      try {
        this.blacklistService = new HybridTokenBlacklistService({
          dbPool,
          fallbackToDb: process.env.TOKEN_BLACKLIST_FALLBACK_TO_DB !== 'false'
        });
        console.log('✅ Híbrido Token Blacklist Service inicializado');
      } catch (error) {
        console.warn('⚠️  Erro ao inicializar híbrido blacklist, usando memória:', error.message);
        this.tokenBlacklist = new Set();
      }
    } else {
      // Fallback para desenvolvimento (memória)
      this.tokenBlacklist = new Set();
      console.warn('⚠️  Using memory blacklist - not suitable for production!');
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(user) {
    if (!user) {
      throw new Error('User is required');
    }

    if (!user.id || !user.accountId) {
      throw new Error('User must have id and accountId');
    }

    const accessTokenPayload = {
      userId: user.id,
      accountId: user.accountId,
      username: user.username,
      email: user.email,
      isRoot: user.isRoot,
      type: 'access'
    };

    const refreshTokenPayload = {
      userId: user.id,
      accountId: user.accountId,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessTokenPayload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry
    });

    const refreshToken = jwt.sign(refreshTokenPayload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour in seconds
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token) {
    // Verificar se o token está revogado
    if (this.blacklistService) {
      const isRevoked = await this.blacklistService.isTokenRevoked(token);
      if (isRevoked) {
        throw new Error('Token has been revoked');
      }
    } else if (this.tokenBlacklist && this.tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    try {
      // First decode to check type (without verification)
      const decoded = jwt.decode(token);
      if (!decoded || decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Then verify signature
      const payload = jwt.verify(token, this.jwtSecret);
      return payload;
    } catch (error) {
      if (error.message === 'Invalid token type') {
        throw error;
      }
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token) {
    try {
      // First decode to check type (without verification)
      const decoded = jwt.decode(token);
      if (!decoded || decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Then verify signature
      const payload = jwt.verify(token, this.jwtRefreshSecret);
      return payload;
    } catch (error) {
      if (error.message === 'Invalid token type') {
        throw error;
      }
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken) {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // Get current user data
    const user = await this.userService.getUserById(payload.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('User is inactive');
    }

    // Generate new tokens
    return await this.generateTokens(user);
  }

  /**
   * Login with email and password
   */
  async loginWithCredentials(email, password) {
    const user = await this.userService.authenticateUser(email, password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      tokens
    };
  }

  /**
   * Login with IAM credentials (accountId + username + password)
   * For IAM users (non-root users)
   */
  async loginWithIAMCredentials(accountId, username, password) {
    if (!accountId || !username || !password) {
      throw new Error('Account ID, username, and password are required');
    }

    // Find user by username and account ID
    const user = await this.userService.authenticateIAMUser(accountId, username, password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    return {
      user,
      tokens
    };
  }

  /**
   * Logout - revoga tokens usando serviço híbrido
   */
  async logout(accessToken, refreshToken, options = {}) {
    try {
      if (this.blacklistService) {
        // Usar serviço híbrido profissional
        const promises = [];
        
        if (accessToken) {
          promises.push(this.blacklistService.revokeToken(accessToken, {
            reason: 'logout',
            ipAddress: options.ipAddress,
            userAgent: options.userAgent
          }));
        }
        
        if (refreshToken) {
          promises.push(this.blacklistService.revokeToken(refreshToken, {
            reason: 'logout',
            ipAddress: options.ipAddress,
            userAgent: options.userAgent
          }));
        }
        
        await Promise.all(promises);
        
        console.log('🚪 Logout híbrido realizado com sucesso');
        return {
          success: true,
          message: 'Logged out successfully',
          method: 'hybrid',
          tokensRevoked: {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken
          }
        };
      } else {
        // Fallback para desenvolvimento (memória)
        if (accessToken) {
          this.tokenBlacklist.add(accessToken);
        }
        if (refreshToken) {
          this.tokenBlacklist.add(refreshToken);
        }
        
        console.log(`🚪 Logout: ${this.tokenBlacklist.size} tokens na blacklist (memory)`);
        return {
          success: true,
          message: 'Logged out successfully',
          method: 'memory',
          tokensRevoked: {
            accessToken: !!accessToken,
            refreshToken: !!refreshToken
          }
        };
      }
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      throw new Error('Logout failed');
    }
  }

  /**
   * Revoga todos os tokens de um usuário (útil para segurança)
   */
  async revokeAllUserTokens(userId, accountId, reason = 'security', options = {}) {
    if (!this.blacklistService) {
      throw new Error('Hybrid blacklist service not available');
    }
    
    try {
      const count = await this.blacklistService.revokeAllUserTokens(
        userId, 
        accountId, 
        reason
      );
      
      console.log(`🚫 ${count} tokens do usuário ${userId} foram revogados`);
      return { success: true, tokensRevoked: count, reason };
    } catch (error) {
      console.error('❌ Erro ao revogar todos os tokens:', error);
      throw new Error('Failed to revoke all user tokens');
    }
  }

  /**
   * Obter estatísticas da blacklist
   */
  async getBlacklistStats() {
    if (!this.blacklistService) {
      return {
        method: 'memory',
        totalTokens: this.tokenBlacklist ? this.tokenBlacklist.size : 0
      };
    }
    
    try {
      const stats = await this.blacklistService.getStats();
      return { method: 'hybrid', ...stats };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Cleanup de tokens expirados
   */
  async cleanupExpiredTokens() {
    if (!this.blacklistService) {
      return 0;
    }
    
    try {
      return await this.blacklistService.cleanup();
    } catch (error) {
      console.error('❌ Erro no cleanup:', error);
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.blacklistService) {
      await this.blacklistService.disconnect();
    }
  }
}

module.exports = { AuthService };
