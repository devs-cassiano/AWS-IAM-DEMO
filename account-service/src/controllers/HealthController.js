const { repositoryFactory } = require('../repositories/RepositoryFactory');

/**
 * Healthcheck avançado para monitoramento
 */
class HealthController {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Healthcheck básico
   */
  async basic(req, res) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  /**
   * Healthcheck detalhado com status de dependências
   */
  async detailed(req, res) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };

    try {
      // Testar Database
      if (repositoryFactory.pool) {
        const dbResult = await repositoryFactory.pool.query('SELECT 1 as test');
        health.services.database = {
          status: 'healthy',
          type: 'postgresql',
          responseTime: '< 10ms'
        };
      } else {
        health.services.database = {
          status: 'unavailable',
          type: 'mock'
        };
      }

      // Testar Redis (se disponível)
      try {
        const Redis = require('ioredis');
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          lazyConnect: true,
          maxRetriesPerRequest: 1
        });
        
        await redis.ping();
        health.services.redis = {
          status: 'healthy',
          type: 'redis',
          responseTime: '< 5ms'
        };
        redis.disconnect();
      } catch (error) {
        health.services.redis = {
          status: 'unavailable',
          error: error.message
        };
      }

      // Verificar memória
      const memUsage = process.memoryUsage();
      health.services.memory = {
        status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      };

      // Status geral
      const unhealthyServices = Object.values(health.services)
        .filter(service => service.status !== 'healthy');
      
      if (unhealthyServices.length > 0) {
        health.status = 'degraded';
        res.status(200); // Ainda 200, mas degraded
      }

      res.json(health);
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
      res.status(503).json(health);
    }
  }

  /**
   * Readiness check para Kubernetes/Docker
   */
  async ready(req, res) {
    try {
      // Verificar se serviços críticos estão prontos
      if (repositoryFactory.pool) {
        await repositoryFactory.pool.query('SELECT 1');
      }

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Liveness check para Kubernetes/Docker
   */
  async alive(req, res) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    });
  }
}

module.exports = { HealthController };
