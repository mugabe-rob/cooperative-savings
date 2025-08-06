const { Contribution, Loan, Group, User } = require('../models');
const { Op } = require('sequelize');

const ReportService = {
  async generateMonthlyReport(groupId) {
    const totalContributions = await Contribution.sum('amount', { where: { groupId } });
    const totalLoans = await Loan.sum('amount', { where: { groupId, status: 'approved' } });

    return {
      groupId,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalContributions: totalContributions || 0,
      totalLoans: totalLoans || 0,
      availableBalance: (totalContributions || 0) - (totalLoans || 0),
    };
  },

  async getLoanStatus(groupId) {
    const loans = await Loan.findAll({
      where: groupId ? { groupId } : {},
      include: [{ model: User, attributes: ['firstName', 'lastName'] }]
    });

    return {
      totalLoans: loans.length,
      approvedLoans: loans.filter(loan => loan.status === 'approved').length,
      pendingLoans: loans.filter(loan => loan.status === 'pending').length,
      rejectedLoans: loans.filter(loan => loan.status === 'rejected').length,
      loans
    };
  },

  async getContributionReport(groupId) {
    const contributions = await Contribution.findAll({
      where: groupId ? { groupId } : {},
      include: [
        { model: User, attributes: ['firstName', 'lastName'] },
        { model: Group, attributes: ['name'] }
      ]
    });

    const totalAmount = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);

    return {
      totalContributions: contributions.length,
      totalAmount,
      contributions
    };
  },

  async groupFinancialSummary(groupId) {
    const totalContributions = await Contribution.sum('amount', { where: { groupId } });
    const totalLoans = await Loan.sum('amount', { where: { groupId, status: 'approved' } });

    return {
      totalContributions: totalContributions || 0,
      totalLoans: totalLoans || 0,
      availableBalance: (totalContributions || 0) - (totalLoans || 0),
    };
  },

  async userLoanSummary(userId) {
    const totalBorrowed = await Loan.sum('amount', { where: { userId, status: 'approved' } });
    return {
      totalBorrowed: totalBorrowed || 0,
    };
  }
};

module.exports = ReportService;