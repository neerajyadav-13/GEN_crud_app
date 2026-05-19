import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import connectDB from '../backend/config/db.js';
import expenseRoutes from '../backend/routes/expenseRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const app = express();
let dbConnected = false;

app.use(async (req, res, next) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/expenses', expenseRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Receipt image is too large. Please upload an image smaller than 3MB for Gemini vision analysis.'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Something went wrong on the server'
  });
});

export default serverless(app);
