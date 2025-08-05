const loanService = require('../services/loan.service');

exports.requestLoan = async (req, res) => {
  const loan = await loanService.createLoan(req.body);
  res.status(201).json(loan);
};

exports.approveLoan = async (req, res) => {
  const loan = await loanService.approveLoan(req.params.loanId);
  res.json(loan);
};

exports.repayLoan = async (req, res) => {
  const result = await loanService.repayLoan(req.params.loanId, req.body.amount);
  res.json(result);
};