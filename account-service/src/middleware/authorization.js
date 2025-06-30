const PolicyEngine = require('../services/PolicyEngine');

/**
 * Advanced authorization middleware using Policy Engine
 */
class AuthorizationMiddleware {
  constructor() {
    this.policyEngine = new PolicyEngine();
  }

  /**
   * Creates middleware function that checks if user has permission for specific action
   * @param {string} service - Service name (e.g., 'iam', 's3')
   * @param {string} action - Action name (e.g., 'CreateUser', 'GetObject')
   * @param {string|Function} resourcePath - Resource path or function to extract it from request
   * @returns {Function} Middleware function
   */
  requirePermission(service, action, resourcePath = '*') {
    return async (req, res, next) => {
      try {
        const { userId, accountId } = req.user;

        if (!userId || !accountId) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Valid JWT token with userId and accountId is required'
          });
        }

        // Check if user has root role - root role users have unrestricted access
        const { repositoryFactory } = require('../repositories/RepositoryFactory');
        const userRoleRepository = repositoryFactory.createUserRoleRepository();
        const hasRootRole = await userRoleRepository.userHasRole(userId, 'root');
        
        if (hasRootRole) {
          return next();
        }

        // Extract resource path
        let finalResourcePath = resourcePath;
        if (typeof resourcePath === 'function') {
          finalResourcePath = resourcePath(req);
        }

        // Build context from request
        const context = this.buildContext(req);

        // Check permission
        const hasPermission = await this.policyEngine.hasPermission(
          userId,
          accountId,
          service,
          action,
          finalResourcePath,
          context
        );

        if (!hasPermission) {
          // Get detailed evaluation for debugging
          const evaluation = await this.policyEngine.evaluateAccess({
            userId,
            accountId,
            action: `${service}:${action}`,
            resource: `arn:aws:${service}::${accountId}:${finalResourcePath}`,
            context
          });

          return res.status(403).json({
            error: 'Access denied',
            message: `Insufficient permissions for ${service}:${action}`,
            details: {
              decision: evaluation.decision,
              reason: evaluation.reason,
              action: `${service}:${action}`,
              resource: `arn:aws:${service}::${accountId}:${finalResourcePath}`
            }
          });
        }

        // Permission granted, continue to next middleware
        next();
      } catch (error) {
        console.error('Authorization middleware error:', error);
        return res.status(500).json({
          error: 'Authorization error',
          message: 'Failed to evaluate permissions'
        });
      }
    };
  }

  /**
   * Builds context object from request
   * @param {Object} req - Express request object
   * @returns {Object} Context object
   */
  buildContext(req) {
    const context = {
      'aws:SourceIp': req.ip || req.connection.remoteAddress,
      'aws:UserAgent': req.get('User-Agent'),
      'aws:RequestedRegion': req.get('X-Requested-Region') || 'us-east-1',
      'aws:CurrentTime': new Date().toISOString()
    };

    // Add custom headers as context
    Object.keys(req.headers).forEach(headerName => {
      if (headerName.startsWith('x-context-')) {
        const contextKey = headerName.replace('x-context-', '');
        context[contextKey] = req.headers[headerName];
      }
    });

    return context;
  }

  /**
   * Middleware to check IAM user management permissions
   */
  requireUserManagement() {
    return this.requirePermission('iam', 'CreateUser', 'user/*');
  }

  /**
   * Middleware to check IAM group management permissions
   */
  requireGroupManagement() {
    return this.requirePermission('iam', 'CreateGroup', 'group/*');
  }

  /**
   * Middleware to check IAM policy management permissions
   */
  requirePolicyManagement() {
    return this.requirePermission('iam', 'CreatePolicy', 'policy/*');
  }

  /**
   * Middleware to check if user can manage specific user
   */
  requireUserAccess() {
    return this.requirePermission('iam', 'GetUser', (req) => {
      const targetUserId = req.params.userId || req.body.userId;
      return targetUserId ? `user/${targetUserId}` : 'user/*';
    });
  }

  /**
   * Middleware to check if user can manage specific group
   */
  requireGroupAccess() {
    return this.requirePermission('iam', 'GetGroup', (req) => {
      const groupId = req.params.groupId;
      return groupId ? `group/${groupId}` : 'group/*';
    });
  }

  /**
   * Middleware to check if user can manage specific policy
   */
  requirePolicyAccess() {
    return this.requirePermission('iam', 'GetPolicy', (req) => {
      const policyId = req.params.policyId;
      return policyId ? `policy/${policyId}` : 'policy/*';
    });
  }

  /**
   * Middleware to check root/admin permissions
   */
  requireRootAccess() {
    return this.requirePermission('iam', '*', '*');
  }

  /**
   * Custom permission checker
   * @param {string} service - Service name
   * @param {string} action - Action name
   * @param {string|Function} resourcePath - Resource path
   */
  requireCustomPermission(service, action, resourcePath) {
    return this.requirePermission(service, action, resourcePath);
  }

  /**
   * Middleware that evaluates access and adds result to request object
   * Doesn't block the request, just adds evaluation result
   */
  evaluateAccess(service, action, resourcePath = '*') {
    return async (req, res, next) => {
      try {
        const { userId, accountId } = req.user;

        if (!userId || !accountId) {
          req.accessEvaluation = {
            decision: 'DENY',
            reason: 'No authentication'
          };
          return next();
        }

        // Extract resource path
        let finalResourcePath = resourcePath;
        if (typeof resourcePath === 'function') {
          finalResourcePath = resourcePath(req);
        }

        // Build context
        const context = this.buildContext(req);

        // Evaluate access
        const evaluation = await this.policyEngine.evaluateAccess({
          userId,
          accountId,
          action: `${service}:${action}`,
          resource: `arn:aws:${service}::${accountId}:${finalResourcePath}`,
          context
        });

        // Add evaluation to request
        req.accessEvaluation = evaluation;
        next();
      } catch (error) {
        console.error('Access evaluation error:', error);
        req.accessEvaluation = {
          decision: 'DENY',
          reason: 'Evaluation error',
          error: error.message
        };
        next();
      }
    };
  }
}

// Create singleton instance
const authorizationMiddleware = new AuthorizationMiddleware();

module.exports = {
  AuthorizationMiddleware,
  authorizationMiddleware,
  
  // Export common middleware functions
  requirePermission: authorizationMiddleware.requirePermission.bind(authorizationMiddleware),
  requireUserManagement: authorizationMiddleware.requireUserManagement.bind(authorizationMiddleware),
  requireGroupManagement: authorizationMiddleware.requireGroupManagement.bind(authorizationMiddleware),
  requirePolicyManagement: authorizationMiddleware.requirePolicyManagement.bind(authorizationMiddleware),
  requireUserAccess: authorizationMiddleware.requireUserAccess.bind(authorizationMiddleware),
  requireGroupAccess: authorizationMiddleware.requireGroupAccess.bind(authorizationMiddleware),
  requirePolicyAccess: authorizationMiddleware.requirePolicyAccess.bind(authorizationMiddleware),
  requireRootAccess: authorizationMiddleware.requireRootAccess.bind(authorizationMiddleware),
  requireCustomPermission: authorizationMiddleware.requireCustomPermission.bind(authorizationMiddleware),
  evaluateAccess: authorizationMiddleware.evaluateAccess.bind(authorizationMiddleware)
};
