const { Group } = require('../models/Group');
const { repositoryFactory } = require('../repositories/RepositoryFactory');

class GroupService {
  constructor() {
    this.groupRepository = repositoryFactory.createGroupRepository();
  }

  /**
   * Creates a new group
   * @param {Object} groupData - Group data
   * @param {string} groupData.accountId - Account ID
   * @param {string} groupData.name - Group name
   * @param {string} [groupData.description] - Group description
   * @param {string} [groupData.path] - Group path
   * @returns {Promise<Group>} Created group
   */
  async createGroup(groupData) {
    try {
      // Validate group data
      const validatedData = Group.validate(groupData);
      
      // Check if group name already exists in account
      const existingGroup = await this.groupRepository.findByName(
        validatedData.name, 
        validatedData.accountId
      );
      
      if (existingGroup) {
        const error = new Error('Group name already exists in this account');
        error.code = 'GROUP_NAME_EXISTS';
        throw error;
      }

      // Create group
      const group = new Group(validatedData);
      return await this.groupRepository.create(group);
    } catch (error) {
      if (error.code === 'GROUP_NAME_EXISTS') {
        throw error;
      }
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Gets a group by ID
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Group|null>} Found group or null
   */
  async getGroupById(groupId, accountId) {
    try {
      if (!groupId || !accountId) {
        throw new Error('Group ID and Account ID are required');
      }

      return await this.groupRepository.findById(groupId, accountId);
    } catch (error) {
      throw new Error(`Failed to get group: ${error.message}`);
    }
  }

  /**
   * Gets a group by name
   * @param {string} name - Group name
   * @param {string} accountId - Account ID
   * @returns {Promise<Group|null>} Found group or null
   */
  async getGroupByName(name, accountId) {
    try {
      if (!name || !accountId) {
        throw new Error('Group name and Account ID are required');
      }

      return await this.groupRepository.findByName(name, accountId);
    } catch (error) {
      throw new Error(`Failed to get group: ${error.message}`);
    }
  }

  /**
   * Lists groups for an account
   * @param {string} accountId - Account ID
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.offset] - Number of results to skip
   * @param {string} [options.pathPrefix] - Filter by path prefix
   * @returns {Promise<Object>} Result with groups and pagination info
   */
  async listGroups(accountId, options = {}) {
    try {
      if (!accountId) {
        throw new Error('Account ID is required');
      }

      const [groups, totalCount] = await Promise.all([
        this.groupRepository.findByAccountId(accountId, options),
        this.groupRepository.count(accountId, { pathPrefix: options.pathPrefix })
      ]);

      return {
        groups,
        totalCount,
        hasMore: options.limit && options.offset !== undefined ? 
          (options.offset + options.limit) < totalCount : false
      };
    } catch (error) {
      throw new Error(`Failed to list groups: ${error.message}`);
    }
  }

  /**
   * Updates a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - New name
   * @param {string} [updateData.description] - New description
   * @param {string} [updateData.path] - New path
   * @returns {Promise<Group>} Updated group
   */
  async updateGroup(groupId, accountId, updateData) {
    try {
      if (!groupId || !accountId) {
        throw new Error('Group ID and Account ID are required');
      }

      // Get existing group
      const existingGroup = await this.groupRepository.findById(groupId, accountId);
      if (!existingGroup) {
        const error = new Error('Group not found');
        error.code = 'GROUP_NOT_FOUND';
        throw error;
      }

      // Check if new name conflicts with existing group
      if (updateData.name && updateData.name !== existingGroup.name) {
        const nameExists = await this.groupRepository.nameExists(
          updateData.name, 
          accountId, 
          groupId
        );
        
        if (nameExists) {
          const error = new Error('Group name already exists in this account');
          error.code = 'GROUP_NAME_EXISTS';
          throw error;
        }
      }

      // Create updated group
      const updatedGroup = existingGroup.clone();
      if (updateData.name !== undefined) updatedGroup.name = updateData.name;
      if (updateData.description !== undefined) updatedGroup.description = updateData.description;
      if (updateData.path !== undefined) updatedGroup.path = updateData.path;

      // Validate updated data
      Group.validate({
        accountId: updatedGroup.accountId,
        name: updatedGroup.name,
        description: updatedGroup.description,
        path: updatedGroup.path
      });

      return await this.groupRepository.update(updatedGroup);
    } catch (error) {
      if (error.code === 'GROUP_NOT_FOUND' || error.code === 'GROUP_NAME_EXISTS') {
        throw error;
      }
      throw new Error(`Failed to update group: ${error.message}`);
    }
  }

  /**
   * Deletes a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteGroup(groupId, accountId) {
    try {
      if (!groupId || !accountId) {
        throw new Error('Group ID and Account ID are required');
      }

      // Check if group exists
      const group = await this.groupRepository.findById(groupId, accountId);
      if (!group) {
        const error = new Error('Group not found');
        error.code = 'GROUP_NOT_FOUND';
        throw error;
      }

      // TODO: Check if group has members or attached policies
      // For now, we'll allow deletion, but in production you might want to prevent this

      const deleted = await this.groupRepository.delete(groupId, accountId);
      
      if (!deleted) {
        throw new Error('Failed to delete group');
      }

      return true;
    } catch (error) {
      if (error.code === 'GROUP_NOT_FOUND') {
        throw error;
      }
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Adds a user to a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if added successfully
   */
  async addUserToGroup(groupId, userId, accountId) {
    try {
      if (!groupId || !userId || !accountId) {
        throw new Error('Group ID, User ID, and Account ID are required');
      }

      // Verify group exists
      const group = await this.groupRepository.findById(groupId, accountId);
      if (!group) {
        const error = new Error('Group not found');
        error.code = 'GROUP_NOT_FOUND';
        throw error;
      }

      // Add user to group
      await this.groupRepository.addUserToGroup(groupId, userId, accountId);
      return true;
    } catch (error) {
      if (error.code === 'GROUP_NOT_FOUND') {
        throw error;
      }
      throw new Error(`Failed to add user to group: ${error.message}`);
    }
  }

  /**
   * Removes a user from a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if removed successfully
   */
  async removeUserFromGroup(groupId, userId, accountId) {
    try {
      if (!groupId || !userId || !accountId) {
        throw new Error('Group ID, User ID, and Account ID are required');
      }

      const removed = await this.groupRepository.removeUserFromGroup(groupId, userId, accountId);
      
      if (!removed) {
        const error = new Error('User not found in group');
        error.code = 'USER_NOT_IN_GROUP';
        throw error;
      }

      return true;
    } catch (error) {
      if (error.code === 'USER_NOT_IN_GROUP') {
        throw error;
      }
      throw new Error(`Failed to remove user from group: ${error.message}`);
    }
  }

  /**
   * Gets all users in a group
   * @param {string} groupId - Group ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Array<Object>>} Array of users
   */
  async getGroupUsers(groupId, accountId) {
    try {
      if (!groupId || !accountId) {
        throw new Error('Group ID and Account ID are required');
      }

      // Verify group exists
      const group = await this.groupRepository.findById(groupId, accountId);
      if (!group) {
        const error = new Error('Group not found');
        error.code = 'GROUP_NOT_FOUND';
        throw error;
      }

      return await this.groupRepository.getUsersInGroup(groupId, accountId);
    } catch (error) {
      if (error.code === 'GROUP_NOT_FOUND') {
        throw error;
      }
      throw new Error(`Failed to get group users: ${error.message}`);
    }
  }

  /**
   * Gets all groups that a user belongs to
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Array<Group>>} Array of groups
   */
  async getUserGroups(userId, accountId) {
    try {
      if (!userId || !accountId) {
        throw new Error('User ID and Account ID are required');
      }

      return await this.groupRepository.findGroupsForUser(userId, accountId);
    } catch (error) {
      throw new Error(`Failed to get user groups: ${error.message}`);
    }
  }

  /**
   * Checks if a user is in a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {Promise<boolean>} True if user is in group
   */
  async isUserInGroup(groupId, userId, accountId) {
    try {
      if (!groupId || !userId || !accountId) {
        throw new Error('Group ID, User ID, and Account ID are required');
      }

      return await this.groupRepository.isUserInGroup(groupId, userId, accountId);
    } catch (error) {
      throw new Error(`Failed to check group membership: ${error.message}`);
    }
  }
}

module.exports = GroupService;
