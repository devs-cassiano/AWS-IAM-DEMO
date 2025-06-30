/**
 * Policy Templates for various AWS services
 * Provides common policy patterns and templates for different use cases
 */
class PolicyTemplates {
  
  /**
   * Get all available policy templates
   */
  static getAllTemplates() {
    return {
      iam: this.getIAMTemplates(),
      s3: this.getS3Templates(),
      ec2: this.getEC2Templates(),
      rds: this.getRDSTemplates(),
      lambda: this.getLambdaTemplates(),
      dynamodb: this.getDynamoDBTemplates(),
      sns: this.getSNSTemplates(),
      sqs: this.getSQSTemplates(),
      cloudwatch: this.getCloudWatchTemplates(),
      vpc: this.getVPCTemplates(),
      route53: this.getRoute53Templates(),
      apigateway: this.getAPIGatewayTemplates()
    };
  }

  /**
   * Get templates for a specific service
   */
  static getTemplatesForService(service) {
    const allTemplates = this.getAllTemplates();
    return allTemplates[service.toLowerCase()] || {};
  }

  /**
   * Get list of supported services
   */
  static getSupportedServices() {
    return Object.keys(this.getAllTemplates());
  }

  /**
   * IAM Service Templates
   */
  static getIAMTemplates() {
    return {
      'ReadOnlyAccess': {
        description: 'Provides read-only access to IAM resources',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'iam:Get*',
              'iam:List*'
            ],
            Resource: '*'
          }]
        }
      },
      'UserManagement': {
        description: 'Allows management of IAM users',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'iam:CreateUser',
              'iam:DeleteUser',
              'iam:UpdateUser',
              'iam:GetUser',
              'iam:ListUsers'
            ],
            Resource: 'arn:aws:iam::*:user/*'
          }]
        }
      },
      'PolicyManagement': {
        description: 'Allows management of IAM policies',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'iam:CreatePolicy',
              'iam:DeletePolicy',
              'iam:GetPolicy',
              'iam:ListPolicies',
              'iam:AttachUserPolicy',
              'iam:DetachUserPolicy'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * S3 Service Templates
   */
  static getS3Templates() {
    return {
      'BucketReadOnly': {
        description: 'Read-only access to S3 bucket',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:ListBucket'
            ],
            Resource: [
              'arn:aws:s3:::BUCKET_NAME',
              'arn:aws:s3:::BUCKET_NAME/*'
            ]
          }]
        }
      },
      'BucketFullAccess': {
        description: 'Full access to S3 bucket',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: 's3:*',
            Resource: [
              'arn:aws:s3:::BUCKET_NAME',
              'arn:aws:s3:::BUCKET_NAME/*'
            ]
          }]
        }
      },
      'BucketWriteOnly': {
        description: 'Write-only access to S3 bucket',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              's3:PutObject',
              's3:PutObjectAcl',
              's3:DeleteObject'
            ],
            Resource: 'arn:aws:s3:::BUCKET_NAME/*'
          }]
        }
      }
    };
  }

  /**
   * EC2 Service Templates
   */
  static getEC2Templates() {
    return {
      'InstanceReadOnly': {
        description: 'Read-only access to EC2 instances',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeImages',
              'ec2:DescribeSnapshots',
              'ec2:DescribeVolumes'
            ],
            Resource: '*'
          }]
        }
      },
      'InstanceManagement': {
        description: 'Manage EC2 instances',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'ec2:RunInstances',
              'ec2:TerminateInstances',
              'ec2:StartInstances',
              'ec2:StopInstances',
              'ec2:RebootInstances',
              'ec2:DescribeInstances'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * RDS Service Templates
   */
  static getRDSTemplates() {
    return {
      'DatabaseReadOnly': {
        description: 'Read-only access to RDS databases',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'rds:DescribeDBInstances',
              'rds:DescribeDBClusters',
              'rds:DescribeDBSnapshots',
              'rds:DescribeDBClusterSnapshots'
            ],
            Resource: '*'
          }]
        }
      },
      'DatabaseManagement': {
        description: 'Manage RDS databases',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'rds:CreateDBInstance',
              'rds:DeleteDBInstance',
              'rds:ModifyDBInstance',
              'rds:StartDBInstance',
              'rds:StopDBInstance',
              'rds:RebootDBInstance'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * Lambda Service Templates
   */
  static getLambdaTemplates() {
    return {
      'FunctionExecute': {
        description: 'Execute Lambda functions',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'lambda:InvokeFunction'
            ],
            Resource: 'arn:aws:lambda:*:*:function:*'
          }]
        }
      },
      'FunctionManagement': {
        description: 'Manage Lambda functions',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'lambda:CreateFunction',
              'lambda:DeleteFunction',
              'lambda:UpdateFunctionCode',
              'lambda:UpdateFunctionConfiguration',
              'lambda:GetFunction',
              'lambda:ListFunctions'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * DynamoDB Service Templates
   */
  static getDynamoDBTemplates() {
    return {
      'TableReadOnly': {
        description: 'Read-only access to DynamoDB table',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:BatchGetItem'
            ],
            Resource: 'arn:aws:dynamodb:*:*:table/TABLE_NAME'
          }]
        }
      },
      'TableFullAccess': {
        description: 'Full access to DynamoDB table',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: 'dynamodb:*',
            Resource: 'arn:aws:dynamodb:*:*:table/TABLE_NAME'
          }]
        }
      }
    };
  }

  /**
   * SNS Service Templates
   */
  static getSNSTemplates() {
    return {
      'TopicPublish': {
        description: 'Publish to SNS topic',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'sns:Publish'
            ],
            Resource: 'arn:aws:sns:*:*:TOPIC_NAME'
          }]
        }
      },
      'TopicManagement': {
        description: 'Manage SNS topics',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'sns:CreateTopic',
              'sns:DeleteTopic',
              'sns:Subscribe',
              'sns:Unsubscribe',
              'sns:Publish'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * SQS Service Templates
   */
  static getSQSTemplates() {
    return {
      'QueueConsumer': {
        description: 'Consume messages from SQS queue',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes'
            ],
            Resource: 'arn:aws:sqs:*:*:QUEUE_NAME'
          }]
        }
      },
      'QueueProducer': {
        description: 'Send messages to SQS queue',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'sqs:SendMessage',
              'sqs:GetQueueAttributes'
            ],
            Resource: 'arn:aws:sqs:*:*:QUEUE_NAME'
          }]
        }
      }
    };
  }

  /**
   * CloudWatch Service Templates
   */
  static getCloudWatchTemplates() {
    return {
      'MetricsReadOnly': {
        description: 'Read CloudWatch metrics',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'cloudwatch:GetMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics'
            ],
            Resource: '*'
          }]
        }
      },
      'LogsReadOnly': {
        description: 'Read CloudWatch logs',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
              'logs:GetLogEvents',
              'logs:FilterLogEvents'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * VPC Service Templates
   */
  static getVPCTemplates() {
    return {
      'NetworkReadOnly': {
        description: 'Read-only access to VPC resources',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'ec2:DescribeVpcs',
              'ec2:DescribeSubnets',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeRouteTables'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * Route53 Service Templates
   */
  static getRoute53Templates() {
    return {
      'ZoneReadOnly': {
        description: 'Read-only access to Route53 zones',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'route53:GetHostedZone',
              'route53:ListHostedZones',
              'route53:ListResourceRecordSets'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }

  /**
   * API Gateway Service Templates
   */
  static getAPIGatewayTemplates() {
    return {
      'APIReadOnly': {
        description: 'Read-only access to API Gateway',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'apigateway:GET'
            ],
            Resource: '*'
          }]
        }
      }
    };
  }
}

module.exports = { PolicyTemplates };
