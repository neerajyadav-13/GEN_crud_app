import mongoose from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Entertainment',
  'Shopping',
  'Medical',
  'Education',
  'Bills',
  'Groceries',
  'Fuel',
  'Other'
];

const expenseSchema = new mongoose.Schema(
  {
    merchantName: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'Other'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
