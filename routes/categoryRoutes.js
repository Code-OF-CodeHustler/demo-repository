const express = require('express');
const {
  getCategories,
  getCategory,
  addCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const router = express.Router({ mergeParams: true });
const { protect } = require('../middlewares/auth');

router
  .route('/')
  .get(protect, getCategories)
  .post(protect, addCategory);

router
  .route('/:id')
  .get(protect, getCategory)
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

module.exports = router;