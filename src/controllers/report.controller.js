const reportService = require('../services/report.service');

exports.generateMonthlyReport = async (req, res) => {
  const report = await reportService.generateMonthlyReport(req.params.groupId);
  res.json(report);
};

exports.getLoanStatusReport = async (req, res) => {
  const report = await reportService.getLoanStatus(req.params.groupId);
  res.json(report);
};