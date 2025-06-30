const express = require('express');
const RoleController = require('../controllers/RoleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/authorization');

const router = express.Router();
const roleController = new RoleController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Role CRUD operations with authorization
router.post('/', 
  requirePermission('iam', 'CreateRole', 'role/*'),
  (req, res) => roleController.createRole(req, res)
);

router.get('/', 
  requirePermission('iam', 'ListRoles', 'role/*'),
  (req, res) => roleController.listRoles(req, res)
);

router.get('/:roleId', 
  requirePermission('iam', 'GetRole', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.getRole(req, res)
);

router.put('/:roleId', 
  requirePermission('iam', 'UpdateRole', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.updateRole(req, res)
);

router.delete('/:roleId', 
  requirePermission('iam', 'DeleteRole', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.deleteRole(req, res)
);

// Role policy operations with authorization
router.post('/:roleId/attach-policy', 
  requirePermission('iam', 'AttachRolePolicy', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.attachPolicyToRole(req, res)
);

router.delete('/:roleId/detach-policy/:policyId', 
  requirePermission('iam', 'DetachRolePolicy', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.detachPolicyFromRole(req, res)
);

router.get('/:roleId/policies', 
  requirePermission('iam', 'ListRolePolicies', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.getRolePolicies(req, res)
);

// Role assumption operations with authorization
router.post('/:roleId/assume', 
  requirePermission('sts', 'AssumeRole', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.assumeRole(req, res)
);

router.get('/:roleId/sessions', 
  requirePermission('iam', 'GetRole', (req) => `role/${req.params.roleId}`),
  (req, res) => roleController.getActiveRoleSessions(req, res)
);

// Session management with authorization
router.delete('/sessions/:sessionId', 
  requirePermission('sts', 'RevokeSession', (req) => `session/${req.params.sessionId}`),
  (req, res) => roleController.revokeRoleSession(req, res)
);

// Validation endpoints with authorization
router.post('/validate-trust-policy', 
  requirePermission('iam', 'ValidateAssumeRolePolicy', 'role/*'),
  (req, res) => roleController.validateAssumeRolePolicyDocument(req, res)
);

module.exports = router;
