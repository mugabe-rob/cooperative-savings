const { Loan, Repayment } = require('../models');

const LoanService = {
  async applyForLoan(data) {
    return await Loan.create(data);
  },

  async approveLoan(id) {
    await Loan.update({ status: 'approved' }, { where: { id } });
    return await Loan.findByPk(id);
  },

  async rejectLoan(id) {
    await Loan.update({ status: 'rejected' }, { where: { id } });
    return await Loan.findByPk(id);
  },

  async getLoansByUser(userId) {
    return await Loan.findAll({ where: { userId } });
  },

  async repayLoan(loanId, amount) {
    const repayment = await Repayment.create({ loanId, amount });
    return repayment;
  },
};

module.exports = LoanService;