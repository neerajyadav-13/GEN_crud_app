import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Expense, { EXPENSE_CATEGORIES } from '../models/Expense.js';
import { analyzeReceiptImage } from '../services/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const buildImageUrl = (filename) => `/uploads/${filename}`;

const buildExpensePayload = (payload) => ({
  merchantName: String(payload.merchantName || '').trim(),
  amount: Number(payload.amount),
  date: new Date(payload.date),
  category: payload.category || 'Other',
  description: String(payload.description || '').trim()
});

const deleteUploadedFile = async (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith('data:')) return;

  const filename = path.basename(imageUrl);
  const filePath = path.join(uploadsDir, filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Could not delete uploaded file: ${error.message}`);
    }
  }
};

const validateExpensePayload = (payload) => {
  const errors = [];
  const amount = Number(payload.amount);

  if (!payload.merchantName || !String(payload.merchantName).trim()) {
    errors.push('Merchant name is required');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    errors.push('Amount must be a positive number');
  }

  if (!payload.date || Number.isNaN(Date.parse(payload.date))) {
    errors.push('A valid date is required');
  }

  if (payload.category && !EXPENSE_CATEGORIES.includes(payload.category)) {
    errors.push('Invalid expense category');
  }

  return errors;
};

const logUploadedReceipt = (file) => {
  console.log('[Receipt Upload]', {
    originalName: file.originalname,
    filename: file.filename || null,
    mimeType: file.mimetype,
    sizeBytes: file.size
  });
};

export const uploadExpense = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Receipt image is required');
  }

  logUploadedReceipt(req.file);

  const imageUrl = req.file.buffer
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    : buildImageUrl(req.file.filename);

  try {
    const extractedData = await analyzeReceiptImage({
      imageBuffer: req.file.buffer,
      uploadedMimeType: req.file.mimetype
    });
    const expense = await Expense.create({
      ...extractedData,
      imageUrl
    });

    res.status(201).json({
      message: 'Receipt analyzed and expense created',
      expense
    });
  } catch (error) {
    await deleteUploadedFile(imageUrl);
    throw error;
  }
});

export const analyzeExpense = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Receipt image is required');
  }

  logUploadedReceipt(req.file);

  const imageUrl = req.file.buffer
    ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
    : buildImageUrl(req.file.filename);

  try {
    const extractedData = await analyzeReceiptImage({
      imageBuffer: req.file.buffer,
      uploadedMimeType: req.file.mimetype
    });

    res.json({
      message: 'Receipt analyzed successfully',
      expense: {
        ...extractedData,
        imageUrl,
        isDraft: true
      }
    });
  } catch (error) {
    await deleteUploadedFile(imageUrl);
    throw error;
  }
});

export const createExpense = asyncHandler(async (req, res) => {
  const errors = validateExpensePayload(req.body);

  if (!req.body.imageUrl) {
    errors.push('Receipt image is required');
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(', '));
  }

  const imageUrl = req.body.imageUrl.startsWith('http') || req.body.imageUrl.startsWith('data:')
    ? req.body.imageUrl
    : buildImageUrl(path.basename(req.body.imageUrl));
  const expense = await Expense.create({
    ...buildExpensePayload(req.body),
    imageUrl
  });

  res.status(201).json({
    message: 'Expense created successfully',
    expense
  });
});

export const getExpenses = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const query = {};

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search) {
    query.merchantName = { $regex: search, $options: 'i' };
  }

  const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  res.json({
    count: expenses.length,
    total,
    expenses
  });
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  res.json(expense);
});

export const updateExpense = asyncHandler(async (req, res) => {
  const errors = validateExpensePayload(req.body);

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(', '));
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  Object.assign(expense, buildExpensePayload(req.body));

  const updatedExpense = await expense.save();
  res.json({
    message: 'Expense updated successfully',
    expense: updatedExpense
  });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  await deleteUploadedFile(expense.imageUrl);
  await expense.deleteOne();

  res.json({
    message: 'Expense and receipt image deleted successfully'
  });
});
