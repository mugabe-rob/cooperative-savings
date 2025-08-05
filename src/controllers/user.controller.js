const userService = require('../services/user.service');

exports.getAllUsers = async (req, res) => {
  const users = await userService.getUsers();
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
};