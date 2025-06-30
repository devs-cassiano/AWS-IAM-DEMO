const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} RoleData
 * @property {string} id - Unique role identifier
 * @property {string} accountId - Account ID this role belongs to
 * @property {string} name - Role name
 * @property {string} description - Role description
 * @property {string} path - Role path (for hierarchical organization)
 * @property {Object} assumeRolePolicyDocument - Trust policy document
 * @property {number} maxSessionDuration - Maximum session duration in seconds
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class Role {
  /**
   * Creates a new Role instance
   * @param {Object} data - Role data
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Role name
   * @param {Object} data.assumeRolePolicyDocument - Trust policy document
   * @param {string} [data.description] - Role description
   * @param {string} [data.path='/'] - Role path
   * @param {number} [data.maxSessionDuration=3600] - Max session duration in seconds
   * @param {string} [data.id] - Role ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.name = data.name;
    this.description = data.description;
    this.path = data.path || '/';
    this.assumeRolePolicyDocument = data.assumeRolePolicyDocument || data.trustPolicy;
    this.trustPolicy = data.trustPolicy || data.assumeRolePolicyDocument; // Alias for compatibility
    this.maxSessionDuration = data.maxSessionDuration;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates this role instance
   * @throws {Error} If validation fails
   */
  validate() {
    return Role.validate(this);
  }

  /**
   * Validates role data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Role name
   * @param {Object} data.assumeRolePolicyDocument - Trust policy document
   * @throws {Error} If validation fails
   * @returns {Object} Validated data
   */
  static validate(data) {
    const errors = [];

    // Validate accountId
    if (!data.accountId) {
      errors.push('Account ID is required');
    } else if (typeof data.accountId !== 'string') {
      errors.push('Account ID must be a string');
    }

    // Validate name
    if (!data.name) {
      errors.push('Role name is required');
    } else if (typeof data.name !== 'string') {
      errors.push('Role name must be a string');
    } else if (data.name.length < 1 || data.name.length > 64) {
      errors.push('Role name must be between 1 and 128 characters');
    } else if (!/^[a-zA-Z0-9+=,.@\-_]+$/.test(data.name)) {
      errors.push('Role name contains invalid characters');
    }

    // Validate assumeRolePolicyDocument
    if (!data.assumeRolePolicyDocument) {
      errors.push('Assume role policy document is required');
    } else if (typeof data.assumeRolePolicyDocument !== 'object') {
      errors.push('Assume role policy document must be an object');
    } else {
      const policyValidation = Role.validateAssumeRolePolicyDocument(data.assumeRolePolicyDocument);
      if (!policyValidation.isValid) {
        errors.push(...policyValidation.errors.map(err => `Assume role policy: ${err}`));
      }
    }

    // Validate optional fields
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string');
    }

    if (data.path && typeof data.path !== 'string') {
      errors.push('Path must be a string');
    } else if (data.path && !data.path.startsWith('/')) {
      errors.push('Path must start with "/"');
    }

    if (data.maxSessionDuration !== undefined) {
      if (typeof data.maxSessionDuration !== 'number') {
        errors.push('Max session duration must be a number');
      } else if (data.maxSessionDuration < 900 || data.maxSessionDuration > 43200) {
        errors.push('Max session duration must be between 900 and 43200 seconds (15 minutes to 12 hours)');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors[0]); // Return first error for simplicity
    }

    return data;
  }

  /**
   * Validates an assume role policy document
   * @param {Object} document - Policy document to validate
   * @returns {Object} Validation result
   */
  static validateAssumeRolePolicyDocument(document) {
    const errors = [];

    // Check required fields
    if (!document.Version) {
      errors.push('Version is required');
    } else if (document.Version !== '2012-10-17') {
      errors.push('Version must be "2012-10-17"');
    }

    if (!document.Statement) {
      errors.push('Statement is required');
    } else if (!Array.isArray(document.Statement)) {
      errors.push('Statement must be an array');
    } else {
      // Validate each statement
      document.Statement.forEach((statement, index) => {
        const statementErrors = Role.validateAssumeRoleStatement(statement);
        if (statementErrors.length > 0) {
          errors.push(...statementErrors.map(err => `Statement[${index}]: ${err}`));
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates a single assume role policy statement
   * @param {Object} statement - Statement to validate
   * @returns {Array} Array of validation errors
   */
  static validateAssumeRoleStatement(statement) {
    const errors = [];

    // Check Effect
    if (!statement.Effect) {
      errors.push('Effect is required');
    } else if (!['Allow', 'Deny'].includes(statement.Effect)) {
      errors.push('Effect must be "Allow" or "Deny"');
    }

    // Check Action (must be sts:AssumeRole for assume role policies)
    if (!statement.Action) {
      errors.push('Action is required');
    } else if (typeof statement.Action === 'string') {
      if (!['sts:AssumeRole', 'sts:*', '*'].includes(statement.Action)) {
        errors.push('Action must allow sts:AssumeRole');
      }
    } else if (Array.isArray(statement.Action)) {
      const hasAssumeRole = statement.Action.some(action => 
        ['sts:AssumeRole', 'sts:*', '*'].includes(action)
      );
      if (!hasAssumeRole) {
        errors.push('Action must include sts:AssumeRole');
      }
    } else {
      errors.push('Action must be a string or array of strings');
    }

    // Check Principal
    if (!statement.Principal) {
      errors.push('Principal is required');
    } else if (typeof statement.Principal !== 'object') {
      errors.push('Principal must be an object');
    } else {
      // Validate principal types
      const validPrincipalTypes = ['AWS', 'Service', 'Federated', 'CanonicalUser'];
      const principalKeys = Object.keys(statement.Principal);
      
      if (principalKeys.length === 0) {
        errors.push('Principal must have at least one principal type');
      }
      
      principalKeys.forEach(key => {
        if (!validPrincipalTypes.includes(key)) {
          errors.push(`Invalid principal type: ${key}`);
        }
      });
    }

    // Check optional Condition
    if (statement.Condition && typeof statement.Condition !== 'object') {
      errors.push('Condition must be an object');
    }

    return errors;
  }

  /**
   * Gets the ARN for this role
   * @param {string} [region=''] - AWS region
   * @returns {string} Role ARN
   */
  getArn(region = '') {
    return `arn:aws:iam::${this.accountId}:role${this.path}${this.name}`;
  }

  /**
   * Checks if a principal can assume this role
   * @param {Object} principal - Principal information
   * @param {string} principal.type - Principal type (AWS, Service, etc.)
   * @param {string} principal.value - Principal value
   * @param {Object} [context] - Additional context for conditions
   * @returns {boolean} True if principal can assume role
   */
  canAssumeRole(principal, context = {}) {
    const document = this.assumeRolePolicyDocument;
    
    if (!document.Statement || !Array.isArray(document.Statement)) {
      return false;
    }

    // Check each statement
    for (const statement of document.Statement) {
      if (statement.Effect === 'Allow' && this.principalMatches(statement.Principal, principal)) {
        // Check conditions if present
        if (statement.Condition) {
          return this.evaluateConditions(statement.Condition, context);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if a principal matches the statement principal
   * @param {Object} statementPrincipal - Principal from policy statement
   * @param {Object} principal - Principal to check
   * @returns {boolean} True if matches
   */
  principalMatches(statementPrincipal, principal) {
    if (!statementPrincipal || !principal) return false;

    const principalType = principal.type;
    const principalValue = principal.value;

    if (!statementPrincipal[principalType]) return false;

    const allowedPrincipals = Array.isArray(statementPrincipal[principalType]) 
      ? statementPrincipal[principalType] 
      : [statementPrincipal[principalType]];

    return allowedPrincipals.some(allowed => {
      if (allowed === '*') return true;
      
      // For AWS principals, support wildcards in account IDs
      if (principalType === 'AWS') {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(principalValue);
      }
      
      return allowed === principalValue;
    });
  }

  /**
   * Simple condition evaluation (can be extended)
   * @param {Object} conditions - Conditions to evaluate
   * @param {Object} context - Context values
   * @returns {boolean} True if conditions pass
   */
  evaluateConditions(conditions, context) {
    // Simplified condition evaluation
    for (const [conditionType, conditionBlock] of Object.entries(conditions)) {
      if (conditionType === 'StringEquals') {
        for (const [key, expectedValue] of Object.entries(conditionBlock)) {
          if (context[key] !== expectedValue) {
            return false;
          }
        }
      }
      // Add more condition types as needed
    }
    return true;
  }

  /**
   * Creates a copy of the role for updating
   * @returns {Role} New Role instance
   */
  clone() {
    return new Role({
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      description: this.description,
      path: this.path,
      assumeRolePolicyDocument: JSON.parse(JSON.stringify(this.assumeRolePolicyDocument)), // Deep clone
      maxSessionDuration: this.maxSessionDuration,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * Creates a Role from JSON data
   * @param {Object} jsonData - JSON data
   * @returns {Role} Role instance
   */
  static fromJSON(jsonData) {
    const data = { ...jsonData };
    
    // Convert string dates to Date objects
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    // Handle legacy field names (like trustPolicy vs assumeRolePolicyDocument)
    if (data.trustPolicy && !data.assumeRolePolicyDocument) {
      data.assumeRolePolicyDocument = data.trustPolicy;
      delete data.trustPolicy;
    }
    
    // Create role but preserve original values (don't auto-generate)
    const role = Object.create(Role.prototype);
    role.id = data.id;
    role.accountId = data.accountId;
    role.name = data.name;
    role.description = data.description;
    role.path = data.path;
    role.assumeRolePolicyDocument = data.assumeRolePolicyDocument;
    role.maxSessionDuration = data.maxSessionDuration;
    role.createdAt = data.createdAt;
    role.updatedAt = data.updatedAt;
    
    return role;
  }

  /**
   * Converts the role to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      description: this.description || '',
      path: this.path || '/',
      assumeRolePolicyDocument: this.assumeRolePolicyDocument,
      maxSessionDuration: this.maxSessionDuration || 3600,
      arn: this.getArn(),
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null
    };
  }

  /**
   * Creates a Role instance from database row
   * @param {Object} row - Database row
   * @returns {Role} Role instance
   */
  static fromDatabaseRow(row) {
    return new Role({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      description: row.description,
      path: row.path,
      assumeRolePolicyDocument: typeof row.assume_role_policy_document === 'string' 
        ? JSON.parse(row.assume_role_policy_document) 
        : row.assume_role_policy_document,
      maxSessionDuration: row.max_session_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}

module.exports = Role;
