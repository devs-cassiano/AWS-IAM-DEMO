/**
 * Example IAM Policies for testing and demonstration
 */

// Full administrator access policy
const ADMIN_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: "*",
      Resource: "*"
    }
  ]
};

// User management policy
const USER_MANAGEMENT_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:CreateUser",
        "iam:GetUser",
        "iam:UpdateUser",
        "iam:DeleteUser",
        "iam:ListUsers"
      ],
      Resource: "arn:aws:iam::*:user/*"
    }
  ]
};

// Group management policy
const GROUP_MANAGEMENT_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:CreateGroup",
        "iam:GetGroup",
        "iam:UpdateGroup",
        "iam:DeleteGroup",
        "iam:ListGroups",
        "iam:AddUserToGroup",
        "iam:RemoveUserFromGroup",
        "iam:GetGroupUsers"
      ],
      Resource: "arn:aws:iam::*:group/*"
    }
  ]
};

// Policy management policy
const POLICY_MANAGEMENT_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:CreatePolicy",
        "iam:GetPolicy",
        "iam:UpdatePolicy",
        "iam:DeletePolicy",
        "iam:ListPolicies",
        "iam:AttachPolicy",
        "iam:DetachPolicy"
      ],
      Resource: "arn:aws:iam::*:policy/*"
    }
  ]
};

// Read-only access policy
const READ_ONLY_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:Get*",
        "iam:List*"
      ],
      Resource: "*"
    }
  ]
};

// Self-service user policy (users can manage their own profile)
const SELF_SERVICE_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:GetUser",
        "iam:UpdateUser",
        "iam:ChangePassword"
      ],
      Resource: "arn:aws:iam::*:user/${aws:username}"
    }
  ]
};

// Conditional access policy with IP restriction
const CONDITIONAL_ACCESS_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:GetUser",
        "iam:ListUsers"
      ],
      Resource: "*",
      Condition: {
        IpAddress: {
          "aws:SourceIp": ["192.168.1.0/24", "10.0.0.0/16"]
        }
      }
    }
  ]
};

// Time-based access policy
const TIME_BASED_ACCESS_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:GetUser",
        "iam:ListUsers"
      ],
      Resource: "*",
      Condition: {
        DateGreaterThan: {
          "aws:CurrentTime": "2024-01-01T00:00:00Z"
        },
        DateLessThan: {
          "aws:CurrentTime": "2025-12-31T23:59:59Z"
        }
      }
    }
  ]
};

// Deny policy example
const DENY_DELETE_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Deny",
      Action: [
        "iam:DeleteUser",
        "iam:DeleteGroup",
        "iam:DeletePolicy"
      ],
      Resource: "*"
    }
  ]
};

// Limited group access policy
const LIMITED_GROUP_ACCESS_POLICY = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: [
        "iam:GetGroup",
        "iam:ListGroups"
      ],
      Resource: "arn:aws:iam::*:group/developers/*"
    },
    {
      Effect: "Allow",
      Action: [
        "iam:AddUserToGroup",
        "iam:RemoveUserFromGroup"
      ],
      Resource: "arn:aws:iam::*:group/developers/*",
      Condition: {
        StringLike: {
          "aws:RequestedRegion": "us-*"
        }
      }
    }
  ]
};

module.exports = {
  ADMIN_POLICY,
  USER_MANAGEMENT_POLICY,
  GROUP_MANAGEMENT_POLICY,
  POLICY_MANAGEMENT_POLICY,
  READ_ONLY_POLICY,
  SELF_SERVICE_POLICY,
  CONDITIONAL_ACCESS_POLICY,
  TIME_BASED_ACCESS_POLICY,
  DENY_DELETE_POLICY,
  LIMITED_GROUP_ACCESS_POLICY,

  // Helper function to get all example policies
  getAllExamplePolicies() {
    return {
      'AdminPolicy': ADMIN_POLICY,
      'UserManagementPolicy': USER_MANAGEMENT_POLICY,
      'GroupManagementPolicy': GROUP_MANAGEMENT_POLICY,
      'PolicyManagementPolicy': POLICY_MANAGEMENT_POLICY,
      'ReadOnlyPolicy': READ_ONLY_POLICY,
      'SelfServicePolicy': SELF_SERVICE_POLICY,
      'ConditionalAccessPolicy': CONDITIONAL_ACCESS_POLICY,
      'TimeBasedAccessPolicy': TIME_BASED_ACCESS_POLICY,
      'DenyDeletePolicy': DENY_DELETE_POLICY,
      'LimitedGroupAccessPolicy': LIMITED_GROUP_ACCESS_POLICY
    };
  },

  // Helper function to create policy objects for database insertion
  createPolicyForAccount(accountId, name, document, description = '', type = 'custom') {
    return {
      accountId,
      name,
      document,
      description,
      type,
      path: '/',
      isDefault: type === 'managed'
    };
  }
};
