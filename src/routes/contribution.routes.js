const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contribution.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', contributionController.createContribution);
router.get('/', contributionController.getAllContributions);
router.get('/group/:groupId', contributionController.getGroupContributions);

module.exports = router;