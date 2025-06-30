const Redis = require('ioredis');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Serviço profissional híbrido para Token Blacklist
 * Usa Redis para performance + PostgreSQL para persistência e auditoria
 */
class HybridTokenBlacklistService {
  constructor(options = {}) {
    this.dbPool = options.dbPool;
    this.redisConfig = options.redis || {};
    this.redis = null;
    this.fallbackToDb = options.fallbackToDb !== false; // Default true
    
    this.initRedis();
  }

  async initRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        keyPrefix: process.env.REDIS_PREFIX || 'iam:bl:',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        ...this.redisConfig
      });

      // Eventos de conexão
      this.redis.on('connect', () => {
        console.log('✅ Redis connected for token blacklist');
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis error:', error.message);
        if (!this.fallbackToDb) {
          throw error;
        }
      });

      // Tentar conectar
      await this.redis.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      if (this.fallbackToDb) {
        console.log('⚠️  Falling back to database-only mode');
        this.redis = null;
      } else {
        throw error;
      }
    }
  }

  /**
   * Adiciona token à blacklist (Redis + Database)
   */
  async revokeToken(token, options = {}) {
    const tokenHash = this._hashToken(token);
    const decoded = this._decodeToken(token);
    
    const revokeData = {
      tokenHash,
      tokenType: decoded.type || 'access',
      userId: decoded.userId,
      accountId: decoded.accountId,
      expiresAt: new Date(decoded.exp * 1000),
      reason: options.reason || 'logout',
      ipAddress: options.ipAddress,
      userAgent: options.userAgent
    };

    // Calcular TTL
    const ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 0);
    if (ttl <= 0) {
      console.log('⏰ Token já expirado, não adicionando à blacklist');
      return;
    }

    try {
      // 1. Adicionar ao Redis (rápido)
      await this._addToRedis(tokenHash, ttl, revokeData);
      
      // 2. Adicionar ao Database (persistência)
      await this._addToDatabase(revokeData);
      
      console.log(`🚫 Token revogado: ${tokenHash.substring(0, 16)}... (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('❌ Erro ao revogar token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Verifica se token está revogado
   */
  async isTokenRevoked(token) {
    const tokenHash = this._hashToken(token);

    try {
      // 1. Verificar Redis primeiro (mais rápido)
      if (this.redis) {
        const redisResult = await this._checkRedis(tokenHash);
        if (redisResult) {
          return true;
        }
      }

      // 2. Verificar Database (fallback ou quando Redis não tem)
      const dbResult = await this._checkDatabase(tokenHash);
      
      // 3. Se encontrou no DB mas não no Redis, sincronizar
      if (dbResult && this.redis) {
        await this._syncToRedis(tokenHash, dbResult);
      }
      
      return dbResult;
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      // Em caso de erro, negar acesso por segurança
      return true;
    }
  }

  /**
   * Revoga todos os tokens de um usuário
   */
  async revokeAllUserTokens(userId, accountId, reason = 'security') {
    try {
      // Buscar tokens ativos do usuário no banco
      const query = `
        SELECT token_hash FROM token_blacklist 
        WHERE user_id = $1 AND account_id = $2 AND expires_at > NOW()
      `;
      const result = await this.dbPool.query(query, [userId, accountId]);
      
      // Adicionar novos tokens à blacklist seria complexo aqui
      // Alternativa: usar uma flag "revoke_all_before" na tabela users
      await this._revokeAllUserTokensInDB(userId, accountId, reason);
      
      console.log(`🚫 Todos os tokens do usuário ${userId} foram revogados`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Erro ao revogar todos os tokens:', error);
      throw new Error('Failed to revoke all user tokens');
    }
  }

  /**
   * Cleanup de tokens expirados
   */
  async cleanup() {
    try {
      // Cleanup no database
      const query = `SELECT cleanup_expired_tokens()`;
      const result = await this.dbPool.query(query);
      const cleaned = result.rows[0].cleanup_expired_tokens;
      
      // Redis faz cleanup automático com TTL
      console.log(`🧹 Cleanup concluído: ${cleaned} tokens removidos`);
      return cleaned;
    } catch (error) {
      console.error('❌ Erro no cleanup:', error);
      throw new Error('Cleanup failed');
    }
  }

  /**
   * Estatísticas da blacklist
   */
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_revoked,
          COUNT(*) FILTER (WHERE token_type = 'access') as access_tokens,
          COUNT(*) FILTER (WHERE token_type = 'refresh') as refresh_tokens,
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active_revoked,
          COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_revoked,
          COUNT(DISTINCT user_id) as affected_users,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as revoked_last_24h
        FROM token_blacklist
      `;
      
      const result = await this.dbPool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }

  // === PRIVATE METHODS ===

  _hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  _decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  async _addToRedis(tokenHash, ttl, data) {
    if (!this.redis) return;
    
    const key = tokenHash;
    const value = JSON.stringify({
      type: data.tokenType,
      userId: data.userId,
      revokedAt: new Date().toISOString(),
      reason: data.reason
    });
    
    await this.redis.setex(key, ttl, value);
  }

  async _checkRedis(tokenHash) {
    if (!this.redis) return false;
    
    const result = await this.redis.get(tokenHash);
    return result !== null;
  }

  async _addToDatabase(data) {
    const query = `
      INSERT INTO token_blacklist (
        token_hash, token_type, user_id, account_id, 
        expires_at, reason, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (token_hash) DO UPDATE SET
        revoked_at = NOW(),
        reason = $6
    `;
    
    await this.dbPool.query(query, [
      data.tokenHash,
      data.tokenType,
      data.userId,
      data.accountId,
      data.expiresAt,
      data.reason,
      data.ipAddress,
      data.userAgent
    ]);
  }

  async _checkDatabase(tokenHash) {
    const query = `
      SELECT expires_at FROM token_blacklist 
      WHERE token_hash = $1 AND expires_at > NOW()
    `;
    
    const result = await this.dbPool.query(query, [tokenHash]);
    return result.rows.length > 0;
  }

  async _syncToRedis(tokenHash, dbData) {
    if (!this.redis) return;
    
    const ttl = Math.max(
      Math.floor((new Date(dbData.expires_at) - Date.now()) / 1000), 
      1
    );
    
    if (ttl > 0) {
      await this.redis.setex(tokenHash, ttl, JSON.stringify(dbData));
    }
  }

  async _revokeAllUserTokensInDB(userId, accountId, reason) {
    // Adicionar flag de revogação global
    const query = `
      INSERT INTO token_blacklist (
        token_hash, token_type, user_id, account_id, 
        expires_at, reason
      ) VALUES (
        'ALL_TOKENS_' || $1, 'global', $1, $2, 
        NOW() + INTERVAL '30 days', $3
      )
      ON CONFLICT (token_hash) DO UPDATE SET
        revoked_at = NOW(),
        reason = $3
    `;
    
    await this.dbPool.query(query, [userId, accountId, reason]);
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.disconnect();
      console.log('✅ Redis disconnected');
    }
  }
}

module.exports = { HybridTokenBlacklistService };
