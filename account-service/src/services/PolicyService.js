const Policy = require('../models/Policy');
const { repositoryFactory } = require('../repositories/RepositoryFactory');

class PolicyService {
  constructor() {
    this.policyRepository = repositoryFactory.createPolicyRepository();
    this.policyAttachmentRepository = repositoryFactory.createPolicyAttachmentRepository();
  }

  /**
   * Creates a new policy
   * @param {Object} policyData - Policy data
   * @param {string} policyData.accountId - Account ID
   * @param {string} policyData.name - Policy name
   * @param {Object} policyData.document - Policy document
   * @param {string} [policyData.description] - Policy description
   * @param {string} [policyData.path] - Policy path
   * @param {string} [policyData.type] - Policy type
   * @returns {Promise<Policy>} Created policy
   */
  async createPolicy(policyData) {
    try {
      // Validate policy data
      const validatedData = Policy.validate(policyData);
      
      // Check if policy name already exists in account
      const existingPolicy = await this.policyRepository.findByName(
        validatedData.name, 
        validatedData.accountId
      );
      
      if (existingPolicy) {
        const error = new Error('Policy name already exists in this account');
        error.code = 'POLICY_NAME_EXISTS';
        throw error;
      }

      // Create policy
      const policy = new Policy(validatedData);
      return await this.policyRepository.create(policy);
    } catch (error) {
      if (error.code === 'POLICY_NAME_EXISTS') {
        throw error;
      }
      throw new Error(`Failed to create policy: ${error.message}`);
    }
  }

  /**
   * Gets a policy by ID
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Policy|null>} Found policy or null
   */
  async getPolicyById(policyId, accountId) {
    try {
      if (!policyId || !accountId) {
        throw new Error('Policy ID and Account ID are required');
      }

      return await this.policyRepository.findById(policyId, accountId);
    } catch (error) {
      throw new Error(`Failed to get policy: ${error.message}`);
    }
  }

  /**
   * Gets a policy by name
   * @param {string} name - Policy name
   * @param {string} accountId - Account ID
   * @returns {Promise<Policy|null>} Found policy or null
   */
  async getPolicyByName(name, accountId) {
    try {
      if (!name || !accountId) {
        throw new Error('Policy name and Account ID are required');
      }

      return await this.policyRepository.findByName(name, accountId);
    } catch (error) {
      throw new Error(`Failed to get policy: ${error.message}`);
    }
  }

  /**
   * Lists policies for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @param {string} [options.type] - Filter by policy type
   * @returns {Promise<Object>} Result with policies and pagination info
   */
  async listPolicies(accountId, options = {}) {
    try {
      if (!accountId) {
        throw new Error('Account ID is required');
      }

      const [policies, totalCount] = await Promise.all([
        this.policyRepository.findByAccountId(accountId, options),
        this.policyRepository.count(accountId, { 
          pathPrefix: options.pathPrefix, 
          type: options.type 
        })
      ]);

      return {
        policies,
        totalCount,
        hasMore: options.limit && options.offset !== undefined ? 
          (options.offset + options.limit) < totalCount : false
      };
    } catch (error) {
      throw new Error(`Failed to list policies: ${error.message}`);
    }
  }

  /**
   * Updates a policy
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - New name
   * @param {string} [updateData.description] - New description
   * @param {string} [updateData.path] - New path
   * @param {Object} [updateData.document] - New policy document
   * @param {string} [updateData.type] - New policy type
   * @returns {Promise<Policy>} Updated policy
   */
  async updatePolicy(policyId, accountId, updateData) {
    try {
      if (!policyId || !accountId) {
        throw new Error('Policy ID and Account ID are required');
      }

      // Get existing policy
      const existingPolicy = await this.policyRepository.findById(policyId, accountId);
      if (!existingPolicy) {
        const error = new Error('Policy not found');
        error.code = 'POLICY_NOT_FOUND';
        throw error;
      }

      // Check if new name conflicts with existing policy
      if (updateData.name && updateData.name !== existingPolicy.name) {
        const nameExists = await this.policyRepository.nameExists(
          updateData.name, 
          accountId, 
          policyId
        );
        
        if (nameExists) {
          const error = new Error('Policy name already exists in this account');
          error.code = 'POLICY_NAME_EXISTS';
          throw error;
        }
      }

      // Create updated policy
      const updatedPolicy = existingPolicy.clone();
      if (updateData.name !== undefined) updatedPolicy.name = updateData.name;
      if (updateData.description !== undefined) updatedPolicy.description = updateData.description;
      if (updateData.path !== undefined) updatedPolicy.path = updateData.path;
      if (updateData.document !== undefined) updatedPolicy.document = updateData.document;
      if (updateData.type !== undefined) updatedPolicy.type = updateData.type;

      // Validate updated data
      Policy.validate({
        accountId: updatedPolicy.accountId,
        name: updatedPolicy.name,
        document: updatedPolicy.document,
        description: updatedPolicy.description,
        path: updatedPolicy.path,
        type: updatedPolicy.type
      });

      return await this.policyRepository.update(updatedPolicy);
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND' || error.code === 'POLICY_NAME_EXISTS') {
        throw error;
      }
      throw new Error(`Failed to update policy: ${error.message}`);
    }
  }

  /**
   * Deletes a policy
   * @param {string} policyId - Policy ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deletePolicy(policyId, accountId) {
    try {
      if (!policyId || !accountId) {
        throw new Error('Policy ID and Account ID are required');
      }

      // Check if policy exists
      const policy = await this.policyRepository.findById(policyId, accountId);
      if (!policy) {
        const error = new Error('Policy not found');
        error.code = 'POLICY_NOT_FOUND';
        throw error;
      }

      // Check if policy is attached to any users or groups
      const attachments = await this.policyAttachmentRepository.findPolicyAttachments(policyId, accountId);
      if (attachments.length > 0) {
        const error = new Error('Cannot delete policy that is attached to users or groups');
        error.code = 'POLICY_IN_USE';
        error.details = { attachmentCount: attachments.length };
        throw error;
      }

      const deleted = await this.policyRepository.delete(policyId, accountId);
      
      if (!deleted) {
        throw new Error('Failed to delete policy');
      }

      return true;
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND' || error.code === 'POLICY_IN_USE') {
        throw error;
      }
      throw new Error(`Failed to delete policy: ${error.message}`);
    }
  }

  /**
   * Attaches a policy to a user
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Attachment result
   */
  async attachPolicyToUser(policyId, userId, accountId) {
    try {
      if (!policyId || !userId || !accountId) {
        throw new Error('Policy ID, User ID, and Account ID are required');
      }

      // Verify policy exists
      const policy = await this.policyRepository.findById(policyId, accountId);
      if (!policy) {
        const error = new Error('Policy not found');
        error.code = 'POLICY_NOT_FOUND';
        throw error;
      }

      // Check if already attached
      const isAttached = await this.policyAttachmentRepository.isPolicyAttachedToUser(
        policyId, userId, accountId
      );
      
      if (isAttached) {
        const error = new Error('Policy is already attached to this user');
        error.code = 'POLICY_ALREADY_ATTACHED';
        throw error;
      }

      const attachment = await this.policyAttachmentRepository.attachPolicyToUser(
        policyId, userId, accountId
      );

      return {
        success: true,
        attachment: attachment.toJSON(),
        message: 'Policy attached to user successfully'
      };
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND' || error.code === 'POLICY_ALREADY_ATTACHED') {
        throw error;
      }
      throw new Error(`Failed to attach policy to user: ${error.message}`);
    }
  }

  /**
   * Attaches a policy to a group
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Attachment result
   */
  async attachPolicyToGroup(policyId, groupId, accountId) {
    try {
      if (!policyId || !groupId || !accountId) {
        throw new Error('Policy ID, Group ID, and Account ID are required');
      }

      // Verify policy exists
      const policy = await this.policyRepository.findById(policyId, accountId);
      if (!policy) {
        const error = new Error('Policy not found');
        error.code = 'POLICY_NOT_FOUND';
        throw error;
      }

      // Check if already attached
      const isAttached = await this.policyAttachmentRepository.isPolicyAttachedToGroup(
        policyId, groupId, accountId
      );
      
      if (isAttached) {
        const error = new Error('Policy is already attached to this group');
        error.code = 'POLICY_ALREADY_ATTACHED';
        throw error;
      }

      const attachment = await this.policyAttachmentRepository.attachPolicyToGroup(
        policyId, groupId, accountId
      );

      return {
        success: true,
        attachment: attachment.toJSON(),
        message: 'Policy attached to group successfully'
      };
    } catch (error) {
      if (error.code === 'POLICY_NOT_FOUND' || error.code === 'POLICY_ALREADY_ATTACHED') {
        throw error;
      }
      throw new Error(`Failed to attach policy to group: ${error.message}`);
    }
  }

  /**
   * Detaches a policy from a user
   * @param {string} policyId - Policy ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if detached successfully
   */
  async detachPolicyFromUser(policyId, userId, accountId) {
    try {
      if (!policyId || !userId || !accountId) {
        throw new Error('Policy ID, User ID, and Account ID are required');
      }

      const detached = await this.policyAttachmentRepository.detachPolicyFromUser(
        policyId, userId, accountId
      );
      
      if (!detached) {
        const error = new Error('Policy is not attached to this user');
        error.code = 'POLICY_NOT_ATTACHED';
        throw error;
      }

      return true;
    } catch (error) {
      if (error.code === 'POLICY_NOT_ATTACHED') {
        throw error;
      }
      throw new Error(`Failed to detach policy from user: ${error.message}`);
    }
  }

  /**
   * Detaches a policy from a group
   * @param {string} policyId - Policy ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if detached successfully
   */
  async detachPolicyFromGroup(policyId, groupId, accountId) {
    try {
      if (!policyId || !groupId || !accountId) {
        throw new Error('Policy ID, Group ID, and Account ID are required');
      }

      const detached = await this.policyAttachmentRepository.detachPolicyFromGroup(
        policyId, groupId, accountId
      );
      
      if (!detached) {
        const error = new Error('Policy is not attached to this group');
        error.code = 'POLICY_NOT_ATTACHED';
        throw error;
      }

      return true;
    } catch (error) {
      if (error.code === 'POLICY_NOT_ATTACHED') {
        throw error;
      }
      throw new Error(`Failed to detach policy from group: ${error.message}`);
    }
  }

  /**
   * Gets all policies for a user (direct and inherited from groups)
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Array<Policy>>} Array of policies
   */
  async getUserPolicies(userId, accountId) {
    try {
      if (!userId || !accountId) {
        throw new Error('User ID and Account ID are required');
      }

      return await this.policyRepository.findPoliciesForUser(userId, accountId);
    } catch (error) {
      throw new Error(`Failed to get user policies: ${error.message}`);
    }
  }

  /**
   * Gets all policies for a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Array<Policy>>} Array of policies
   */
  async getGroupPolicies(groupId, accountId) {
    try {
      if (!groupId || !accountId) {
        throw new Error('Group ID and Account ID are required');
      }

      return await this.policyRepository.findPoliciesForGroup(groupId, accountId);
    } catch (error) {
      throw new Error(`Failed to get group policies: ${error.message}`);
    }
  }

  /**
   * Gets default system policies
   * @returns {Promise<Array<Policy>>} Array of default policies
   */
  async getDefaultPolicies() {
    try {
      return await this.policyRepository.findDefaultPolicies();
    } catch (error) {
      throw new Error(`Failed to get default policies: ${error.message}`);
    }
  }

  /**
   * Validates a policy document
   * @param {Object} document - Policy document to validate
   * @returns {Object} Validation result
   */
  validatePolicyDocument(document) {
    return Policy.validatePolicyDocument(document);
  }
}

module.exports = { PolicyService };
