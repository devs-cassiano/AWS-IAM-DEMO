/**
 * Controller para métricas e monitoramento
 */
class MetricsController {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Métricas gerais do sistema
   */
  async getMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version
        }
      };

      // Métricas de blacklist se disponível
      if (this.authService) {
        const blacklistStats = await this.authService.getBlacklistStats();
        if (blacklistStats) {
          metrics.tokenBlacklist = blacklistStats;
        }
      }

      res.status(200).json(metrics);
    } catch (error) {
      console.error('MetricsController.getMetrics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics'
      });
    }
  }

  /**
   * Métricas em formato Prometheus (opcional)
   */
  async getPrometheusMetrics(req, res) {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      let metrics = `# HELP iam_uptime_seconds Total uptime in seconds
# TYPE iam_uptime_seconds counter
iam_uptime_seconds ${uptime}

# HELP iam_memory_usage_bytes Memory usage in bytes
# TYPE iam_memory_usage_bytes gauge
iam_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}
iam_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}
iam_memory_usage_bytes{type="external"} ${memUsage.external}

# HELP iam_process_start_timestamp_seconds Process start timestamp
# TYPE iam_process_start_timestamp_seconds gauge
iam_process_start_timestamp_seconds ${Date.now() / 1000 - uptime}
`;

      // Adicionar métricas de blacklist se disponível
      if (this.authService) {
        const blacklistStats = await this.authService.getBlacklistStats();
        if (blacklistStats && blacklistStats.total_revoked !== undefined) {
          metrics += `
# HELP iam_tokens_revoked_total Total number of revoked tokens
# TYPE iam_tokens_revoked_total counter
iam_tokens_revoked_total ${blacklistStats.total_revoked}

# HELP iam_tokens_active_revoked Active revoked tokens
# TYPE iam_tokens_active_revoked gauge
iam_tokens_active_revoked ${blacklistStats.active_revoked || 0}
`;
        }
      }

      res.set('Content-Type', 'text/plain');
      res.status(200).send(metrics);
    } catch (error) {
      console.error('MetricsController.getPrometheusMetrics error:', error);
      res.status(500).send('# Failed to retrieve metrics\n');
    }
  }
}

module.exports = { MetricsController };
