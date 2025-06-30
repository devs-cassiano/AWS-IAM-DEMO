const express = require('express');
const GroupController = require('../controllers/GroupController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, requireGroupManagement, requireGroupAccess } = require('../middleware/authorization');

const router = express.Router();
const groupController = new GroupController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Group CRUD operations with authorization
router.post('/', 
  requireGroupManagement(),
  (req, res) => groupController.createGroup(req, res)
);

router.get('/', 
  requirePermission('iam', 'ListGroups', 'group/*'),
  (req, res) => groupController.listGroups(req, res)
);

router.get('/:groupId', 
  requirePermission('iam', 'GetGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.getGroup(req, res)
);

router.put('/:groupId', 
  requirePermission('iam', 'UpdateGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.updateGroup(req, res)
);

router.delete('/:groupId', 
  requirePermission('iam', 'DeleteGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.deleteGroup(req, res)
);

// Group membership operations with authorization
router.post('/:groupId/users', 
  requirePermission('iam', 'AddUserToGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.addUserToGroup(req, res)
);

router.delete('/:groupId/users/:userId', 
  requirePermission('iam', 'RemoveUserFromGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.removeUserFromGroup(req, res)
);

router.get('/:groupId/users', 
  requirePermission('iam', 'GetGroup', (req) => `group/${req.params.groupId}`),
  (req, res) => groupController.getGroupUsers(req, res)
);

// User's groups - can check own groups or need permission to see others
router.get('/users/:userId/groups', 
  requirePermission('iam', 'GetUser', (req) => `user/${req.params.userId}`),
  (req, res) => groupController.getUserGroups(req, res)
);

module.exports = router;
