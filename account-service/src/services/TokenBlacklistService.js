const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Serviço profissional para gerenciamento de Token Blacklist
 * Suporta múltiplos backends: Redis, Database, Memory (dev)
 */
class TokenBlacklistService {
  constructor(options = {}) {
    this.backend = options.backend || 'memory'; // 'redis', 'database', 'memory'
    this.redisClient = options.redisClient;
    this.dbClient = options.dbClient;
    
    // Fallback para desenvolvimento
    if (this.backend === 'memory') {
      this.memoryBlacklist = new Map();
      console.warn('⚠️  Using memory blacklist - not suitable for production!');
    }
  }

  /**
   * Adiciona token à blacklist
   * @param {string} token - JWT token
   * @param {number} ttl - Time to live em segundos (opcional)
   */
  async addToBlacklist(token, ttl = null) {
    const tokenHash = this._hashToken(token);
    
    // Calcular TTL se não fornecido
    if (!ttl) {
      try {
        const decoded = jwt.decode(token);
        ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl <= 0) return; // Token já expirado
      } catch (error) {
        ttl = 3600; // Default 1 hora
      }
    }

    switch (this.backend) {
      case 'redis':
        await this._addToRedis(tokenHash, ttl);
        break;
      case 'database':
        await this._addToDatabase(tokenHash, ttl);
        break;
      case 'memory':
        this._addToMemory(tokenHash, ttl);
        break;
      default:
        throw new Error(`Unsupported backend: ${this.backend}`);
    }
  }

  /**
   * Verifica se token está na blacklist
   * @param {string} token - JWT token
   * @returns {boolean} True se estiver na blacklist
   */
  async isBlacklisted(token) {
    const tokenHash = this._hashToken(token);

    switch (this.backend) {
      case 'redis':
        return await this._checkRedis(tokenHash);
      case 'database':
        return await this._checkDatabase(tokenHash);
      case 'memory':
        return this._checkMemory(tokenHash);
      default:
        throw new Error(`Unsupported backend: ${this.backend}`);
    }
  }

  /**
   * Cleanup de tokens expirados (para backends que não fazem automaticamente)
   */
  async cleanup() {
    switch (this.backend) {
      case 'database':
        await this._cleanupDatabase();
        break;
      case 'memory':
        this._cleanupMemory();
        break;
      // Redis já faz cleanup automático com TTL
    }
  }

  // === PRIVATE METHODS ===

  _hashToken(token) {
    // Hash do token para não armazenar o token completo
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Redis backend
  async _addToRedis(tokenHash, ttl) {
    await this.redisClient.setex(`bl:${tokenHash}`, ttl, '1');
  }

  async _checkRedis(tokenHash) {
    const result = await this.redisClient.get(`bl:${tokenHash}`);
    return result !== null;
  }

  // Database backend
  async _addToDatabase(tokenHash, ttl) {
    const expiresAt = new Date(Date.now() + (ttl * 1000));
    const query = `
      INSERT INTO token_blacklist (token_hash, expires_at) 
      VALUES ($1, $2) 
      ON CONFLICT (token_hash) DO UPDATE SET expires_at = $2
    `;
    await this.dbClient.query(query, [tokenHash, expiresAt]);
  }

  async _checkDatabase(tokenHash) {
    const query = `
      SELECT 1 FROM token_blacklist 
      WHERE token_hash = $1 AND expires_at > NOW()
    `;
    const result = await this.dbClient.query(query, [tokenHash]);
    return result.rows.length > 0;
  }

  async _cleanupDatabase() {
    const query = `DELETE FROM token_blacklist WHERE expires_at <= NOW()`;
    const result = await this.dbClient.query(query);
    console.log(`🧹 Cleaned up ${result.rowCount} expired tokens from database`);
  }

  // Memory backend (development only)
  _addToMemory(tokenHash, ttl) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.memoryBlacklist.set(tokenHash, expiresAt);
  }

  _checkMemory(tokenHash) {
    const expiresAt = this.memoryBlacklist.get(tokenHash);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      this.memoryBlacklist.delete(tokenHash);
      return false;
    }
    return true;
  }

  _cleanupMemory() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [hash, expiresAt] of this.memoryBlacklist.entries()) {
      if (now > expiresAt) {
        this.memoryBlacklist.delete(hash);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired tokens from memory`);
    }
  }
}

module.exports = { TokenBlacklistService };
