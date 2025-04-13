const express = require('express');
const {
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth');

router
  .route('/')
  .get(protect, getTransactions)
  .post(protect, addTransaction);

router
  .route('/:id')
  .get(protect, getTransaction)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction);

module.exports = router;