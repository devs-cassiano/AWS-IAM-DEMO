const express = require('express');
const { PermissionController } = require('../controllers/PermissionController');
const { PermissionAssignmentController } = require('../controllers/PermissionAssignmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireUserManagement, requirePermission } = require('../middleware/authorization');

/**
 * Create unified permission routes
 * Combines permission management and assignment in one place
 * All Swagger documentation is in the respective controllers
 */
function createPermissionRoutes() {
  const router = express.Router();
  const permissionController = new PermissionController();
  const assignmentController = new PermissionAssignmentController();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // =============================================================================
  // PERMISSION MANAGEMENT ROUTES
  // =============================================================================

  // Create permission
  router.post('/', permissionController.createPermission.bind(permissionController));

  // Get all permissions
  router.get('/', permissionController.getPermissions.bind(permissionController));

  // Get permissions grouped by service
  router.get('/services', permissionController.getServicePermissions.bind(permissionController));

  // Get permission by ID
  router.get('/:id', permissionController.getPermissionById.bind(permissionController));

  // Update permission
  router.put('/:id', permissionController.updatePermission.bind(permissionController));

  // Delete permission
  router.delete('/:id', permissionController.deletePermission.bind(permissionController));

  // Attach permission to policy
  router.post('/:id/attach-policy', permissionController.attachPermissionToPolicy.bind(permissionController));

  // Detach permission from policy
  router.delete('/:id/detach-policy/:policyId', permissionController.detachPermissionFromPolicy.bind(permissionController));

  // =============================================================================
  // PERMISSION ASSIGNMENT ROUTES
  // =============================================================================

  // Assign policy to user
  router.post('/users/:userId/policies/:policyId', 
    requireUserManagement(), 
    (req, res) => assignmentController.assignPolicyToUser(req, res)
  );

  // Remove policy from user
  router.delete('/users/:userId/policies/:policyId', 
    requireUserManagement(), 
    (req, res) => assignmentController.removePolicyFromUser(req, res)
  );

  // Assign role to user
  router.post('/users/:userId/roles/:roleId', 
    requireUserManagement(), 
    (req, res) => assignmentController.assignRoleToUser(req, res)
  );

  // Remove role from user
  router.delete('/users/:userId/roles/:roleId', 
    requireUserManagement(), 
    (req, res) => assignmentController.removeRoleFromUser(req, res)
  );

  // =============================================================================
  // PERMISSION QUERY ROUTES
  // =============================================================================

  // Get permissions attached to a policy
  router.get('/policies/:policyId/permissions', permissionController.getPolicyPermissions.bind(permissionController));

  // Get permissions for a role (through policies)
  router.get('/roles/:roleId/permissions', permissionController.getRolePermissions.bind(permissionController));

  // Get permissions for a user (through roles and policies)
  router.get('/users/:userId/permissions', permissionController.getUserPermissions.bind(permissionController));

  return router;
}

module.exports = { createPermissionRoutes };
