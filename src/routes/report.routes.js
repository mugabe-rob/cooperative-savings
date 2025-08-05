const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.verifyToken);

router.get('/summary', reportController.getGroupSummary);
router.get('/loans', reportController.getLoanReport);
router.get('/contributions', reportController.getContributionReport);

module.exports = router;