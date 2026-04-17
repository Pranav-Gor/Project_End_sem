const express = require('express');
const { depositFunds, requestWithdrawal } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/deposit', depositFunds);
router.post('/withdraw', requestWithdrawal);

module.exports = router;
