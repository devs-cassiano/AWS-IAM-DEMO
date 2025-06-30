const express = require('express');
const PolicyController = require('../controllers/PolicyController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission, requirePolicyManagement, requirePolicyAccess } = require('../middleware/authorization');

const router = express.Router();
const policyController = new PolicyController();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Policy CRUD operations with authorization
router.post('/', 
  requirePolicyManagement(),
  (req, res) => policyController.createPolicy(req, res)
);

router.get('/', 
  requirePermission('iam', 'ListPolicies', 'policy/*'),
  (req, res) => policyController.listPolicies(req, res)
);

router.get('/default', 
  requirePermission('iam', 'ListPolicies', 'policy/*'),
  (req, res) => policyController.getDefaultPolicies(req, res)
);

router.get('/:policyId', 
  requirePermission('iam', 'GetPolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.getPolicy(req, res)
);

router.put('/:policyId', 
  requirePermission('iam', 'UpdatePolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.updatePolicy(req, res)
);

router.delete('/:policyId', 
  requirePermission('iam', 'DeletePolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.deletePolicy(req, res)
);

// Policy attachment operations with authorization
router.post('/:policyId/attach-user', 
  requirePermission('iam', 'AttachUserPolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.attachPolicyToUser(req, res)
);

router.post('/:policyId/attach-group', 
  requirePermission('iam', 'AttachGroupPolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.attachPolicyToGroup(req, res)
);

router.delete('/:policyId/detach-user/:userId', 
  requirePermission('iam', 'DetachUserPolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.detachPolicyFromUser(req, res)
);

router.delete('/:policyId/detach-group/:groupId', 
  requirePermission('iam', 'DetachGroupPolicy', (req) => `policy/${req.params.policyId}`),
  (req, res) => policyController.detachPolicyFromGroup(req, res)
);

// Get policies for users/groups - requires permission to view target resource
router.get('/users/:userId/policies', 
  requirePermission('iam', 'ListUserPolicies', (req) => `user/${req.params.userId}`),
  (req, res) => policyController.getUserPolicies(req, res)
);

router.get('/groups/:groupId/policies', 
  requirePermission('iam', 'ListGroupPolicies', (req) => `group/${req.params.groupId}`),
  (req, res) => policyController.getGroupPolicies(req, res)
);

// Policy validation - requires policy management permission
router.post('/validate', 
  requirePermission('iam', 'ValidatePolicy', 'policy/*'),
  (req, res) => policyController.validatePolicyDocument(req, res)
);

module.exports = router;
