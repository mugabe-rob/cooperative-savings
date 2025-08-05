const { User } = require('../models');

const UserService = {
  async getAllUsers() {
    return await User.findAll();
  },

  async getUserById(id) {
    return await User.findByPk(id);
  },

  async updateUser(id, data) {
    await User.update(data, { where: { id } });
    return await User.findByPk(id);
  },

  async deleteUser(id) {
    return await User.destroy({ where: { id } });
  },
};

module.exports = UserService;