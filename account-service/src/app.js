const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { repositoryFactory } = require('./repositories/RepositoryFactory');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize database factory
let dbInitialized = false;
repositoryFactory.initialize()
  .then(() => {
    dbInitialized = true;
    console.log(`✅ Using ${repositoryFactory.getDatabaseType()} database`);
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error.message);
    dbInitialized = false;
  });


// Setup Swagger documentation
const { setupSwagger } = require('./swagger');
setupSwagger(app);

// Import routes
const account = require('./routes/accountRoutes');
const userRoutes = require('./routes/userRoutes');
const { createEnhancedAuthRoutes } = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const policyRoutes = require('./routes/policyRoutes');
const roleRoutes = require('./routes/roleRoutes');
const { authMiddleware, requireAccountAccess } = require('./middleware/authMiddleware');
const permissionRoutes = require('./routes/permissionRoutes');

// Request logging (can be replaced with proper logging middleware)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Import controllers for monitoring
const { HealthController } = require('./controllers/HealthController');
const { MetricsController } = require('./controllers/MetricsController');

const healthController = new HealthController();

// Health check endpoints
app.get('/health', healthController.basic.bind(healthController));
app.get('/health/detailed', healthController.detailed.bind(healthController));
app.get('/health/ready', healthController.ready.bind(healthController));
app.get('/health/alive', healthController.alive.bind(healthController));

// Metrics endpoints (protected em produção)
const metricsController = new MetricsController();
app.get('/metrics', metricsController.getMetrics.bind(metricsController));
app.get('/metrics/prometheus', metricsController.getPrometheusMetrics.bind(metricsController));

// Public routes (no authentication required)
app.use('/api/v1/auth', createEnhancedAuthRoutes());

// Account routes (some protected)
app.use('/api/v1/accounts', account.router);

// Protected user routes (require authentication)
app.use('/api/v1/users', authMiddleware, userRoutes.createUserRoutes());

// Account-user routes (require authentication and account access)
app.use('/api/v1/accounts', authMiddleware, requireAccountAccess, account.createAccountUserRoutes());

// IAM Core routes (require authentication)
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/policies', policyRoutes);

const { createPermissionRoutes } = require('./routes/permissionRoutes');
app.use('/api/v1/permissions', createPermissionRoutes());

app.use('/api/v1/roles', roleRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
