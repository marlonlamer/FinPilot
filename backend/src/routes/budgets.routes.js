const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { listBudgets, createBudget, updateBudget, deleteBudget, budgetSummary } = require('../controllers/budgets.controller');

router.get('/', authMiddleware, listBudgets);
router.get('/summary', authMiddleware, budgetSummary);
router.post('/', authMiddleware, createBudget);
router.put('/:id', authMiddleware, updateBudget);
router.delete('/:id', authMiddleware, deleteBudget);

module.exports = router;
