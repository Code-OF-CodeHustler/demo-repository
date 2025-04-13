const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @route   GET /api/v1/users/:userId/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const transactions = await Transaction.find({ user: req.params.userId });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id).populate({
    path: 'user',
    select: 'name email',
  });

  if (!transaction) {
    return next(
      new ErrorResponse(`No transaction with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

// @desc    Add transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.addTransaction = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const category = await Category.findById(req.body.category);

  if (!category) {
    return next(
      new ErrorResponse(`No category with the id of ${req.body.category}`, 404)
    );
  }

  const transaction = await Transaction.create(req.body);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

// @desc    Update transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  let transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`No transaction with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this transaction`,
        401
      )
    );
  }

  transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: transaction,
  });
});

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(
      new ErrorResponse(`No transaction with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is transaction owner
  if (transaction.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this transaction`,
        401
      )
    );
  }

  await transaction.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
