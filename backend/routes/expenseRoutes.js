import express from 'express';
import {
  analyzeExpense,
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
  uploadExpense
} from '../controllers/expenseController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', upload.single('receipt'), uploadExpense);
router.post('/analyze', upload.single('receipt'), analyzeExpense);
router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
