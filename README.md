# Generative CRUD Expense Tracker

A full-stack MERN expense tracker that uploads receipt images, analyzes them with a backend-only Groq API key, stores extracted expense details in MongoDB, and supports complete CRUD operations.

## Tech Stack

- React.js, Axios, React hooks, Vite
- Node.js, Express.js, MongoDB, Mongoose
- Multer uploads, CORS, dotenv
- Backend-only Groq AI image analysis

## Project Structure

```text
backend/
  server.js
  .env.example
  config/db.js
  models/Expense.js
  routes/expenseRoutes.js
  controllers/expenseController.js
  middleware/uploadMiddleware.js
  services/aiService.js
  uploads/
frontend/
  vite.config.js
  src/
    components/
      ExpenseForm.jsx
      ExpenseList.jsx
      ExpenseCard.jsx
      ExpenseFilter.jsx
      ExpenseSummary.jsx
    pages/Dashboard.jsx
    api/expenseApi.js
    App.jsx
    main.jsx
    index.css
```

## Installation

```bash
npm install
npm run install:all
```

Or install each app separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Setup

1. Start MongoDB locally.
2. Copy the backend environment template:

```bash
cd backend
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

3. Update `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/gen-crud-expense-tracker
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
CLIENT_URL=http://localhost:5173
```

4. Run both apps:

```bash
npm run dev
```

Backend: `http://localhost:5000`

Frontend: `http://localhost:5173`

## API Routes

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/expenses/analyze` | Upload receipt image and return AI-extracted draft fields without saving to MongoDB |
| POST | `/api/expenses` | Save a reviewed AI draft or manual expense payload |
| POST | `/api/expenses/upload` | Upload receipt image, analyze with AI, and create expense |
| GET | `/api/expenses` | Get all expenses |
| GET | `/api/expenses/:id` | Get one expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense and image file |

## AI + CRUD Flow

1. The user selects a receipt image in the React dashboard.
2. React sends the file to `POST /api/expenses/analyze` using `multipart/form-data`.
3. Multer validates that the upload is an image and stores it in `backend/uploads`.
4. The backend converts the image to a base64 data URL and sends it to Groq's OpenAI-compatible chat completions endpoint.
5. The AI is instructed to return structured JSON only:

```json
{
  "merchantName": "KFC",
  "amount": 450,
  "date": "2026-05-18",
  "category": "Food",
  "description": "Fast food purchase"
}
```

6. The backend validates and normalizes the result, then returns a draft object and image URL to React.
7. The user corrects AI-filled fields and clicks save.
8. React sends the reviewed payload to `POST /api/expenses`, which creates the MongoDB record.
9. The original `POST /api/expenses/upload` route is also available when you want one-step upload, AI analysis, and create.
10. The dashboard supports search, category filtering, total spend summaries, edit, and delete.

## Notes

- The Groq API key is never sent to React.
- If `GROQ_API_KEY` is missing, uploads still create a draft expense using fallback values so the CRUD workflow remains testable.
- Use a Groq vision model for receipt images. The default is `meta-llama/llama-4-scout-17b-16e-instruct`.
- Upload receipt images smaller than 3MB so the base64 image stays within Groq's request limit.
- Uploaded files are served from `/uploads`.
- Deleting an expense also deletes its uploaded image from disk.
