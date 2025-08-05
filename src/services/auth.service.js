const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const AuthService = {
  async register(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({ ...userData, password: hashedPassword });
    return user;
  },

  async login(email, password) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Incorrect password');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return { token, user };
  },
};

module.exports = AuthService;