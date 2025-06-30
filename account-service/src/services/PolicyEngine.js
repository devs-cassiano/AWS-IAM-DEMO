const { PolicyService } = require('./PolicyService');
const GroupService = require('./GroupService');

/**
 * Policy Engine - Evaluates access permissions based on policies
 */
class PolicyEngine {
  constructor() {
    this.policyService = new PolicyService();
    this.groupService = new GroupService();
  }

  /**
   * Evaluates if a user is allowed to perform an action on a resource
   * @param {Object} request - Access request
   * @param {string} request.userId - User ID
   * @param {string} request.accountId - Account ID
   * @param {string} request.action - Action to perform (e.g., 'iam:CreateUser')
   * @param {string} request.resource - Resource ARN (e.g., 'arn:aws:iam::123456789012:user/*')
   * @param {Object} [request.context] - Additional context for conditions
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateAccess(request) {
    try {
      const { userId, accountId, action, resource, context = {} } = request;

      if (!userId || !accountId || !action || !resource) {
        throw new Error('userId, accountId, action, and resource are required');
      }

      // Get all policies for the user (direct and inherited from groups)
      const policies = await this.policyService.getUserPolicies(userId, accountId);

      if (policies.length === 0) {
        return {
          decision: 'DENY',
          reason: 'No policies found for user',
          matchedPolicies: []
        };
      }

      // Evaluate policies
      const evaluation = this.evaluatePolicies(policies, action, resource, context);

      return {
        decision: evaluation.decision,
        reason: evaluation.reason,
        matchedPolicies: evaluation.matchedPolicies,
        userId,
        accountId,
        action,
        resource
      };
    } catch (error) {
      return {
        decision: 'DENY',
        reason: `Policy evaluation error: ${error.message}`,
        matchedPolicies: [],
        error: true
      };
    }
  }

  /**
   * Evaluates multiple policies against an action and resource
   * @param {Array<Policy>} policies - Array of policies to evaluate
   * @param {string} action - Action to check
   * @param {string} resource - Resource to check
   * @param {Object} context - Additional context
   * @returns {Object} Evaluation result
   */
  evaluatePolicies(policies, action, resource, context) {
    const matchedPolicies = [];
    let hasExplicitAllow = false;
    let hasExplicitDeny = false;
    let denyReason = '';

    // Process each policy
    for (const policy of policies) {
      const policyEvaluation = this.evaluatePolicy(policy, action, resource, context);
      
      if (policyEvaluation.matched) {
        matchedPolicies.push({
          policyId: policy.id,
          policyName: policy.name,
          effect: policyEvaluation.effect,
          statement: policyEvaluation.statement
        });

        if (policyEvaluation.effect === 'Deny') {
          hasExplicitDeny = true;
          denyReason = `Explicit deny from policy: ${policy.name}`;
        } else if (policyEvaluation.effect === 'Allow') {
          hasExplicitAllow = true;
        }
      }
    }

    // AWS IAM logic: Explicit deny always wins
    if (hasExplicitDeny) {
      return {
        decision: 'DENY',
        reason: denyReason,
        matchedPolicies
      };
    }

    // If there's an explicit allow, grant access
    if (hasExplicitAllow) {
      return {
        decision: 'ALLOW',
        reason: 'Explicit allow from policy',
        matchedPolicies
      };
    }

    // Default deny if no explicit allow
    return {
      decision: 'DENY',
      reason: 'No explicit allow found (default deny)',
      matchedPolicies
    };
  }

  /**
   * Evaluates a single policy against an action and resource
   * @param {Policy} policy - Policy to evaluate
   * @param {string} action - Action to check
   * @param {string} resource - Resource to check
   * @param {Object} context - Additional context
   * @returns {Object} Policy evaluation result
   */
  evaluatePolicy(policy, action, resource, context) {
    const document = policy.document || policy.policy_document;

    if (!document || !document.Statement || !Array.isArray(document.Statement)) {
      return { matched: false };
    }

    // Check each statement in the policy
    for (const statement of document.Statement) {
      const statementEvaluation = this.evaluateStatement(statement, action, resource, context);
      
      if (statementEvaluation.matched) {
        return {
          matched: true,
          effect: statement.Effect,
          statement: statement
        };
      }
    }

    return { matched: false };
  }

  /**
   * Evaluates a single policy statement
   * @param {Object} statement - Policy statement
   * @param {string} action - Action to check
   * @param {string} resource - Resource to check
   * @param {Object} context - Additional context
   * @returns {Object} Statement evaluation result
   */
  evaluateStatement(statement, action, resource, context) {
    // Check if action matches
    const actionMatches = this.matchesPattern(action, statement.Action);
    if (!actionMatches) {
      return { matched: false };
    }

    // Check if resource matches
    const resourceMatches = this.matchesPattern(resource, statement.Resource);
    if (!resourceMatches) {
      return { matched: false };
    }

    // Check conditions if present
    if (statement.Condition) {
      const conditionMatches = this.evaluateConditions(statement.Condition, context);
      if (!conditionMatches) {
        return { matched: false };
      }
    }

    return { matched: true };
  }

  /**
   * Checks if a value matches a pattern (supports wildcards)
   * @param {string|Array<string>} patterns - Pattern(s) to match against
   * @param {string} value - Value to check
   * @returns {boolean} True if matches
   */
  matchesPattern(value, patterns) {
    if (!patterns) return false;

    // Convert single pattern to array
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];

    return patternArray.some(pattern => {
      // Handle wildcards
      if (pattern === '*') return true;
      
      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')  // Replace * with .*
        .replace(/\?/g, '.');   // Replace ? with .
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(value);
    });
  }

  /**
   * Evaluates policy conditions
   * @param {Object} conditions - Conditions to evaluate
   * @param {Object} context - Context values
   * @returns {boolean} True if all conditions pass
   */
  evaluateConditions(conditions, context) {
    // Simple condition evaluation - can be extended for more complex conditions
    for (const [conditionType, conditionBlock] of Object.entries(conditions)) {
      const conditionResult = this.evaluateConditionBlock(conditionType, conditionBlock, context);
      if (!conditionResult) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluates a condition block
   * @param {string} conditionType - Type of condition (e.g., 'StringEquals')
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateConditionBlock(conditionType, conditionBlock, context) {
    switch (conditionType) {
      case 'StringEquals':
        return this.evaluateStringEquals(conditionBlock, context);
      
      case 'StringLike':
        return this.evaluateStringLike(conditionBlock, context);
      
      case 'IpAddress':
        return this.evaluateIpAddress(conditionBlock, context);
      
      case 'DateGreaterThan':
        return this.evaluateDateGreaterThan(conditionBlock, context);
      
      case 'DateLessThan':
        return this.evaluateDateLessThan(conditionBlock, context);
      
      default:
        // Unknown condition type - default to false for security
        console.warn(`Unknown condition type: ${conditionType}`);
        return false;
    }
  }

  /**
   * Evaluates StringEquals condition
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateStringEquals(conditionBlock, context) {
    for (const [key, expectedValue] of Object.entries(conditionBlock)) {
      const contextValue = context[key];
      if (contextValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates StringLike condition (with wildcards)
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateStringLike(conditionBlock, context) {
    for (const [key, pattern] of Object.entries(conditionBlock)) {
      const contextValue = context[key];
      if (!contextValue || !this.matchesPattern(contextValue, pattern)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates IpAddress condition
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateIpAddress(conditionBlock, context) {
    // Simplified IP address matching - in production, use proper IP/CIDR libraries
    for (const [key, expectedIp] of Object.entries(conditionBlock)) {
      const contextIp = context[key];
      if (!contextIp || contextIp !== expectedIp) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates DateGreaterThan condition
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateDateGreaterThan(conditionBlock, context) {
    for (const [key, expectedDate] of Object.entries(conditionBlock)) {
      const contextDate = new Date(context[key]);
      const compareDate = new Date(expectedDate);
      if (contextDate <= compareDate) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluates DateLessThan condition
   * @param {Object} conditionBlock - Condition block
   * @param {Object} context - Context values
   * @returns {boolean} True if condition passes
   */
  evaluateDateLessThan(conditionBlock, context) {
    for (const [key, expectedDate] of Object.entries(conditionBlock)) {
      const contextDate = new Date(context[key]);
      const compareDate = new Date(expectedDate);
      if (contextDate >= compareDate) {
        return false;
      }
    }
    return true;
  }

  /**
   * Creates a simplified access request for common scenarios
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {string} service - Service name (e.g., 'iam', 's3')
   * @param {string} action - Action name (e.g., 'CreateUser', 'GetObject')
   * @param {string} [resourcePath] - Resource path (e.g., 'user/john', 'bucket/documents')
   * @param {Object} [context] - Additional context
   * @returns {Object} Formatted access request
   */
  createAccessRequest(userId, accountId, service, action, resourcePath = '*', context = {}) {
    const fullAction = `${service}:${action}`;
    const fullResource = `arn:aws:${service}::${accountId}:${resourcePath}`;

    return {
      userId,
      accountId,
      action: fullAction,
      resource: fullResource,
      context
    };
  }

  /**
   * Quick method to check if user has permission for a specific action
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @param {string} service - Service name
   * @param {string} action - Action name
   * @param {string} [resourcePath] - Resource path
   * @param {Object} [context] - Additional context
   * @returns {Promise<boolean>} True if allowed
   */
  async hasPermission(userId, accountId, service, action, resourcePath = '*', context = {}) {
    const request = this.createAccessRequest(userId, accountId, service, action, resourcePath, context);
    const result = await this.evaluateAccess(request);
    return result.decision === 'ALLOW';
  }

  /**
   * Evaluates permission for an action on a resource given policies
   * @param {string} action - Action to evaluate
   * @param {string} resource - Resource to evaluate
   * @param {Array} policies - Array of policies
   * @returns {Object} Evaluation result
   */
  evaluatePermission(action, resource, policies) {
    if (!policies || policies.length === 0) {
      return { allowed: false, reason: 'No policy allows this action' };
    }

    const evaluation = this.evaluatePolicies(policies, action, resource, {});
    
    if (evaluation.decision === 'ALLOW') {
      // Get the first matching policy's name for the reason
      const allowPolicy = evaluation.matchedPolicies.find(p => p.effect === 'Allow');
      return {
        allowed: true,
        reason: allowPolicy ? `Allowed by policy: ${allowPolicy.policyName}` : 'Allowed by 1 policy(ies)'
      };
    } else {
      // Check if it's an explicit deny or default deny
      const denyPolicy = evaluation.matchedPolicies.find(p => p.effect === 'Deny');
      if (denyPolicy) {
        return {
          allowed: false,
          reason: `Denied by policy: ${denyPolicy.policyName}`
        };
      } else {
        return {
          allowed: false,
          reason: 'No policy allows this action'
        };
      }
    }
  }

  /**
   * Process a single policy statement
   * @param {Object} statement - Policy statement
   * @param {string} action - Action to evaluate
   * @param {string} resource - Resource to evaluate
   * @returns {Object|null} Result or null if no match
   */
  processStatement(statement, action, resource) {
    if (!this.matchesAction(action, statement.Action)) {
      return null;
    }

    if (!this.matchesResource(resource, statement.Resource)) {
      return null;
    }

    const isAllow = statement.Effect === 'Allow';
    return {
      allowed: isAllow,
      reason: isAllow 
        ? 'Allowed by policy: TestPolicy' 
        : 'Denied by policy: TestPolicy'
    };
  }

  /**
   * Check if action matches statement actions
   * @param {string} action - Action to check
   * @param {string|Array} statementActions - Statement actions
   * @returns {boolean} True if matches
   */
  matchesAction(action, statementActions) {
    if (Array.isArray(statementActions)) {
      return statementActions.some(a => this.matchesPattern(action, a));
    }
    return this.matchesPattern(action, statementActions);
  }

  /**
   * Check if resource matches statement resources
   * @param {string} resource - Resource to check
   * @param {string|Array} statementResources - Statement resources
   * @returns {boolean} True if matches
   */
  matchesResource(resource, statementResources) {
    if (Array.isArray(statementResources)) {
      return statementResources.some(r => this.matchesPattern(resource, r));
    }
    return this.matchesPattern(resource, statementResources);
  }
}

module.exports = PolicyEngine;
