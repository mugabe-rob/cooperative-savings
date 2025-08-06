const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const UserService = {
  async getAllUsers() {
    return await User.findAll({
      attributes: { exclude: ['password'] }
    });
  },

  async getUserById(id) {
    return await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
  },

  async createUser(userData) {
    const { fullName, phone, email, password, role = 'member' } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with UUID
    const user = await User.create({
      id: uuidv4(),
      fullName,
      phone,
      email,
      password: hashedPassword,
      role
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },

  async authenticateUser(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  },

  async updateUser(id, data) {
    await User.update(data, { where: { id } });
    return await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
  },

  async deleteUser(id) {
    return await User.destroy({ where: { id } });
  },
};

module.exports = UserService;