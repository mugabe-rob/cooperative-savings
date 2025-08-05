const authService = require('../services/user.service');
const jwt = require('../utils/jwt');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.authenticateUser(email, password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.generateToken({ id: user.id, role: user.role });
  res.json({ token });
};

exports.register = async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(201).json(user);
};