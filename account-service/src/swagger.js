const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IAM Account Service API',
      version: '1.0.0',
      description: 'AWS IAM-like Account Service API with complete role and user management',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and login endpoints'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Roles',
        description: 'Role management operations'
      },
      {
        name: 'Policies',
        description: 'Policy management operations'
      },
      {
        name: 'Permissions',
        description: 'Individual permission management following AWS IAM pattern'
      },
      {
        name: 'Permission Assignment',
        description: 'Assign and manage user permissions through roles and policies'
      },
      {
        name: 'Permission Management',
        description: 'Generic permission management for all AWS services (deprecated - use Permissions)'
      }
    ],
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Role: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'role-123' },
            accountId: { type: 'string', example: 'account-456', nullable: true, description: 'NULL for system roles' },
            name: { type: 'string', example: 'AdminRole' },
            description: { type: 'string', example: 'Administrator role' },
            path: { type: 'string', example: '/', default: '/' },
            assumeRolePolicyDocument: {
              type: 'object',
              properties: {
                Version: { type: 'string', example: '2012-10-17' },
                Statement: { type: 'array', items: { type: 'object' } }
              }
            },
            maxSessionDuration: { type: 'number', example: 3600 },
            arn: { type: 'string', example: 'arn:aws:iam::account-456:role/AdminRole' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RoleSession: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'session-123' },
            roleId: { type: 'string', example: 'role-456' },
            assumedBy: { type: 'string', example: 'user-789' },
            sessionName: { type: 'string', example: 'MySession' },
            credentials: {
              type: 'object',
              properties: {
                accessKeyId: { type: 'string' },
                secretAccessKey: { type: 'string' },
                sessionToken: { type: 'string' }
              }
            },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'AIDACKCEVSQ6C2EXAMPLE' },
            accountId: { type: 'string', example: 'ACC-001' },
            username: { type: 'string', example: 'john.doe' },
            email: { type: 'string', example: 'john@example.com', nullable: true },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            isRoot: { 
              type: 'boolean', 
              example: false,
              description: 'Legacy field - system now uses roles. Root users have the "root" role assigned.'
            },
            firstName: { type: 'string', example: 'John', nullable: true },
            lastName: { type: 'string', example: 'Doe', nullable: true },
            arn: { type: 'string', example: 'arn:aws:iam::ACC-001:user/john.doe' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'account-123' },
            name: { type: 'string', example: 'My Company' },
            email: { type: 'string', example: 'admin@company.com' },
            status: { type: 'string', example: 'active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Policy: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'policy-123' },
            accountId: { type: 'string', example: 'account-456', nullable: true },
            name: { type: 'string', example: 'S3ReadOnlyPolicy' },
            description: { type: 'string', example: 'Allows read-only access to S3 buckets' },
            path: { type: 'string', example: '/', default: '/' },
            policyDocument: {
              type: 'object',
              properties: {
                Version: { type: 'string', example: '2012-10-17' },
                Statement: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      Effect: { type: 'string', enum: ['Allow', 'Deny'] },
                      Action: { type: 'array', items: { type: 'string' } },
                      Resource: { type: 'array', items: { type: 'string' } },
                      Condition: { type: 'object' }
                    }
                  }
                }
              }
            },
            policyType: { type: 'string', enum: ['AWS', 'Custom', 'Inline'], example: 'Custom' },
            isAttachable: { type: 'boolean', example: true },
            attachmentCount: { type: 'number', example: 0 },
            arn: { type: 'string', example: 'arn:aws:iam::account-456:policy/S3ReadOnlyPolicy' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: { 
              type: 'string', 
              example: 'perm-123',
              description: 'Unique permission identifier'
            },
            accountId: { 
              type: 'string', 
              example: 'account-456',
              description: 'Account ID that owns this permission'
            },
            service: { 
              type: 'string', 
              example: 's3',
              description: 'AWS service name'
            },
            action: { 
              type: 'string', 
              example: 's3:GetObject',
              description: 'AWS action in service:action format'
            },
            resourcePattern: { 
              type: 'string', 
              example: 'arn:aws:s3:::my-bucket/*',
              description: 'Resource pattern or ARN. Use * for all resources'
            },
            effect: { 
              type: 'string', 
              enum: ['Allow', 'Deny'], 
              example: 'Allow',
              description: 'Permission effect - Allow or Deny'
            },
            conditions: { 
              type: 'object', 
              example: {"StringEquals": {"aws:RequestedRegion": "us-east-1"}},
              description: 'IAM condition block for fine-grained access control',
              nullable: true
            },
            description: { 
              type: 'string', 
              example: 'Allow reading objects from S3 bucket',
              description: 'Human-readable description of the permission',
              nullable: true
            },
            isSystem: {
              type: 'boolean',
              example: false,
              description: 'Whether this is a system-managed permission'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Permission creation timestamp'
            },
            updatedAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Permission last update timestamp'
            }
          },
          required: ['id', 'accountId', 'service', 'action', 'resourcePattern', 'effect']
        },
        UserRole: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'role-123' },
            name: { type: 'string', example: 'AdminRole' },
            description: { type: 'string', example: 'Administrator role' },
            assignedAt: { type: 'string', format: 'date-time' },
            assignedBy: { type: 'string', example: 'user-456' }
          }
        },
        UserRolesResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string', example: 'user-123' },
                username: { type: 'string', example: 'john.doe' },
                roles: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserRole' }
                }
              }
            },
            message: { type: 'string', example: 'User roles retrieved successfully' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            details: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'IAM Account Service API',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        // Ensure proper headers
        req.headers['Content-Type'] = 'application/json';
        return req;
      }
    }
  }));
  
  // Serve raw swagger spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.send(specs);
  });
};

module.exports = { setupSwagger, specs };
