const { Contribution, User, Group } = require('../models');

const ContributionService = {
  async createContribution(data) {
    return await Contribution.create(data);
  },

  async getAllContributions() {
    return await Contribution.findAll({
      include: [
        { model: User, attributes: ['id', 'firstName', 'lastName'] },
        { model: Group, attributes: ['id', 'name'] }
      ]
    });
  },

  async getGroupContributions(groupId) {
    return await Contribution.findAll({ where: { groupId } });
  },

  async getUserContributions(userId) {
    return await Contribution.findAll({ where: { userId } });
  },

  async deleteContribution(id) {
    return await Contribution.destroy({ where: { id } });
  }
};

module.exports = ContributionService;