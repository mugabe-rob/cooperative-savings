const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', loanController.requestLoan);
router.get('/', loanController.getAllLoans);
router.post('/:id/repay', loanController.repayLoan);

module.exports = router;