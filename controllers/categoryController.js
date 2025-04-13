const Category = require('../models/Category');
const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @route   GET /api/v1/users/:userId/categories
// @access  Private
exports.getCategories = asyncHandler(async (req, res, next) => {
  if (req.params.userId) {
    const categories = await Category.find({ user: req.params.userId });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Private
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate({
    path: 'user',
    select: 'name email',
  });

  if (!category) {
    return next(
      new ErrorResponse(`No category with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Add category
// @route   POST /api/v1/categories
// @access  Private
exports.addCategory = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`No category with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is category owner
  if (category.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this category`,
        401
      )
    );
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(
      new ErrorResponse(`No category with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is category owner
  if (category.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this category`,
        401
      )
    );
  }

  // Check if category is being used by any transactions
  const transactions = await Transaction.countDocuments({ category: req.params.id });

  if (transactions > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete category as it is being used by ${transactions} transaction(s)`,
        400
      )
    );
  }

  await category.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});