const express = require('express');
const { 
    transferMoney,
    getTransactions, 
    getBalance,
    deleteTransaction,
    bulkDeleteTransactions,
    addTransaction
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All payment routes are protected
router.use(protect);

router.post('/transfer', transferMoney);
router.post('/transaction', addTransaction);
router.get('/transactions', getTransactions);
router.delete('/transactions/bulk', bulkDeleteTransactions);
router.delete('/transaction/:id', deleteTransaction);
router.get('/balance', getBalance);

module.exports = router;
