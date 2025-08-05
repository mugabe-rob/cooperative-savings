const groupService = require('../services/group.service');

exports.createGroup = async (req, res) => {
  const group = await groupService.createGroup(req.body);
  res.status(201).json(group);
};

exports.getGroups = async (req, res) => {
  const groups = await groupService.getAllGroups();
  res.json(groups);
};

exports.getGroupById = async (req, res) => {
  const group = await groupService.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  res.json(group);
};