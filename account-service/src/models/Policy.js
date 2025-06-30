const { v4: uuidv4 } = require('uuid');

/**
 * @typedef {Object} PolicyData
 * @property {string} id - Unique policy identifier
 * @property {string} accountId - Account ID this policy belongs to
 * @property {string} name - Policy name
 * @property {string} description - Policy description
 * @property {string} path - Policy path (for hierarchical organization)
 * @property {Object} document - Policy document (JSON with statements)
 * @property {string} type - Policy type (managed, inline, custom)
 * @property {boolean} isDefault - Whether this is a default system policy
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

class Policy {
  /**
   * Creates a new Policy instance
   * @param {Object} data - Policy data
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Policy name
   * @param {Object} data.document - Policy document
   * @param {string} [data.description] - Policy description
   * @param {string} [data.path='/'] - Policy path
   * @param {string} [data.type='custom'] - Policy type
   * @param {boolean} [data.isDefault=false] - Whether this is a default policy
   * @param {string} [data.id] - Policy ID (auto-generated if not provided)
   * @param {Date} [data.createdAt] - Creation date (auto-generated if not provided)
   * @param {Date} [data.updatedAt] - Update date (auto-generated if not provided)
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.accountId = data.accountId;
    this.name = data.name;
    this.description = data.description || '';
    this.path = data.path || '/';
    this.document = data.document;
    this.type = data.type || 'Custom';
    this.isDefault = data.isDefault || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Validates this policy instance
   * @throws {Error} If validation fails
   */
  validate() {
    return Policy.validate(this);
  }

  /**
   * Gets the ARN for this policy
   * @returns {string} Policy ARN
   */
  getArn() {
    return `arn:aws:iam::${this.accountId}:policy${this.path}${this.name}`;
  }

  /**
   * Validates policy data
   * @param {Object} data - Data to validate
   * @param {string} data.accountId - Account ID
   * @param {string} data.name - Policy name
   * @param {Object} data.document - Policy document
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
      errors.push('Policy name is required');
    } else if (typeof data.name !== 'string') {
      errors.push('Policy name must be a string');
    } else if (data.name.length < 1 || data.name.length > 128) {
      errors.push('Policy name must be between 1 and 128 characters');
    } else if (!/^[a-zA-Z0-9+=,.@\-_]+$/.test(data.name)) {
      errors.push('Policy name contains invalid characters');
    }

    // Validate document
    if (!data.document) {
      errors.push('Policy document is required');
    } else if (typeof data.document !== 'object') {
      errors.push('Policy document must be an object');
    } else {
      const documentValidation = Policy.validatePolicyDocument(data.document);
      if (!documentValidation.isValid) {
        errors.push(...documentValidation.errors.map(err => `Policy document: ${err}`));
      }
    }

    // Validate optional fields
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description && data.description.length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }

    if (data.path && typeof data.path !== 'string') {
      errors.push('Path must be a string');
    } else if (data.path && !data.path.startsWith('/')) {
      errors.push('Path must start with "/"');
    }

    if (data.type && !['AWS', 'Custom', 'Inline'].includes(data.type)) {
      errors.push('Policy type must be one of: AWS, Custom, Inline');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]); // Return first error for simplicity
    }

    return data;
  }

  /**
   * Validates a policy document structure
   * @param {Object} document - Policy document to validate
   * @returns {Object} Validation result
   */
  static validatePolicyDocument(document) {
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
        const statementErrors = Policy.validateStatement(statement);
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
   * Validates a single policy statement
   * @param {Object} statement - Statement to validate
   * @returns {Array} Array of validation errors
   */
  static validateStatement(statement) {
    const errors = [];

    // Check Effect
    if (!statement.Effect) {
      errors.push('Effect is required');
    } else if (!['Allow', 'Deny'].includes(statement.Effect)) {
      errors.push('Effect must be "Allow" or "Deny"');
    }

    // Check Action
    if (!statement.Action) {
      errors.push('Action is required');
    } else if (typeof statement.Action === 'string') {
      // Single action
      if (!Policy.isValidAction(statement.Action)) {
        errors.push(`Invalid action: ${statement.Action}`);
      }
    } else if (Array.isArray(statement.Action)) {
      // Multiple actions
      statement.Action.forEach(action => {
        if (!Policy.isValidAction(action)) {
          errors.push(`Invalid action: ${action}`);
        }
      });
    } else {
      errors.push('Action must be a string or array of strings');
    }

    // Check Resource
    if (!statement.Resource) {
      errors.push('Resource is required');
    } else if (typeof statement.Resource === 'string') {
      // Single resource
      if (!Policy.isValidResource(statement.Resource)) {
        errors.push(`Invalid resource: ${statement.Resource}`);
      }
    } else if (Array.isArray(statement.Resource)) {
      // Multiple resources
      statement.Resource.forEach(resource => {
        if (!Policy.isValidResource(resource)) {
          errors.push(`Invalid resource: ${resource}`);
        }
      });
    } else {
      errors.push('Resource must be a string or array of strings');
    }

    // Check optional Condition
    if (statement.Condition && typeof statement.Condition !== 'object') {
      errors.push('Condition must be an object');
    }

    return errors;
  }

  /**
   * Validates an action string
   * @param {string} action - Action to validate
   * @returns {boolean} Whether the action is valid
   */
  static isValidAction(action) {
    if (typeof action !== 'string') return false;
    
    // Allow wildcards
    if (action === '*') return true;
    
    // Basic pattern: service:action or service:*
    const actionPattern = /^[a-zA-Z][a-zA-Z0-9]*:[a-zA-Z*][a-zA-Z0-9*]*$/;
    return actionPattern.test(action);
  }

  /**
   * Validates a resource string
   * @param {string} resource - Resource to validate
   * @returns {boolean} Whether the resource is valid
   */
  static isValidResource(resource) {
    if (typeof resource !== 'string') return false;
    
    // Allow wildcards
    if (resource === '*') return true;
    
    // Basic pattern: arn:aws:service:region:account:resource
    // For simplicity, we'll allow any string that looks like an ARN or is a wildcard
    const arnPattern = /^arn:[a-zA-Z0-9\-]*:[a-zA-Z0-9\-]*:[a-zA-Z0-9\-]*:[a-zA-Z0-9\-]*:[a-zA-Z0-9\-\/*]*$/;
    return arnPattern.test(resource) || resource.includes('*');
  }

  /**
   * Creates a Policy from JSON data
   * @param {Object} jsonData - JSON data
   * @returns {Policy} Policy instance
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
    
    // Handle legacy field names (like policyDocument vs document)
    if (data.policyDocument && !data.document) {
      data.document = data.policyDocument;
      delete data.policyDocument;
    }
    
    return new Policy(data);
  }

  /**
   * Creates a copy of the policy for updating
   * @returns {Policy} New Policy instance
   */
  clone() {
    return new Policy({
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      description: this.description,
      path: this.path,
      document: JSON.parse(JSON.stringify(this.document)), // Deep clone
      type: this.type,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: new Date()
    });
  }

  /**
   * Converts the policy to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      name: this.name,
      description: this.description,
      path: this.path,
      document: this.document,
      type: this.type,
      isDefault: this.isDefault,
      arn: this.getArn(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Creates a Policy instance from database row
   * @param {Object} row - Database row
   * @returns {Policy} Policy instance
   */
  static fromDatabaseRow(row) {
    return new Policy({
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      description: row.description,
      path: row.path,
      document: typeof row.policy_document === 'string' ? JSON.parse(row.policy_document) : row.policy_document,
      type: row.policy_type,
      isDefault: false, // Não existe na tabela, usar false como padrão
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}

module.exports = Policy;
