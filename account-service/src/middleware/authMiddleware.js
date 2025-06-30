const { AuthService } = require('../services/AuthService');
const { repositoryFactory } = require('../repositories/RepositoryFactory');

// Create a singleton AuthService instance for middleware
// In a real application, this would be injected via DI container
let authServiceInstance = null;

function getAuthService() {
  if (!authServiceInstance) {
    // Para o middleware, criar AuthService com pool do banco para blacklist híbrida
    const dbPool = repositoryFactory.pool;
    authServiceInstance = new AuthService(null, dbPool);
  }
  return authServiceInstance;
}

/**
 * Authentication middleware - requires valid JWT token
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    const authService = getAuthService();
    const payload = await authService.verifyAccessToken(token);

    // Add user info to request
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

/**
 * Require root user middleware - must be used after authMiddleware
 */
async function requireRoot(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Check if user has root role
  const { repositoryFactory } = require('../repositories/RepositoryFactory');
  const userRoleRepository = repositoryFactory.createUserRoleRepository();
  const hasRootRole = await userRoleRepository.userHasRole(req.user.userId, 'root');
  
  if (!hasRootRole) {
    return res.status(403).json({
      success: false,
      error: 'Root access required'
    });
  }

  next();
}

/**
 * Optional authentication middleware - doesn't require token but adds user if present
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.user = null;
      return next();
    }

    const token = parts[1];
    const authService = getAuthService();
    const payload = await authService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    req.user = null;
    next();
  }
}

/**
 * Account ownership middleware - ensures user belongs to the account in params
 */
async function requireAccountAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const accountId = req.params.accountId || req.params.id;
  
  if (!accountId) {
    return res.status(400).json({
      success: false,
      error: 'Account ID required'
    });
  }

  // Check if user has root role - root users can access any account
  const { repositoryFactory } = require('../repositories/RepositoryFactory');
  const userRoleRepository = repositoryFactory.createUserRoleRepository();
  const hasRootRole = await userRoleRepository.userHasRole(req.user.userId, 'root');
  
  // Root users can access any account, regular users only their own
  if (!hasRootRole && req.user.accountId !== accountId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this account'
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  requireRoot,
  optionalAuth,
  requireAccountAccess
};
