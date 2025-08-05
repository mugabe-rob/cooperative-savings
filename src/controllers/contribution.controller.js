const contributionService = require('../services/contribution.service');

exports.addContribution = async (req, res) => {
  const contribution = await contributionService.createContribution(req.body);
  res.status(201).json(contribution);
};

exports.getGroupContributions = async (req, res) => {
  const data = await contributionService.getGroupContributions(req.params.groupId);
  res.json(data);
};

exports.getMemberContributions = async (req, res) => {
  const data = await contributionService.getMemberContributions(req.params.memberId);
  res.json(data);
};