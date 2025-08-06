const { Group, User } = require('../models');

const GroupService = {
  async createGroup(data) {
    return await Group.create(data);
  },

  async getAllGroups() {
    return await Group.findAll();
  },

  async getGroupById(id) {
    return await Group.findByPk(id);
  },

  async updateGroup(id, data) {
    await Group.update(data, { where: { id } });
    return await Group.findByPk(id);
  },

  async deleteGroup(id) {
    return await Group.destroy({ where: { id } });
  }
};

module.exports = GroupService;

