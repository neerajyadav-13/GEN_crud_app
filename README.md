# Generative CRUD Expense Tracker

A full-stack MERN expense tracker that uploads receipt images, analyzes them with a backend-only Gemini API key, stores extracted expense details in MongoDB, and supports complete CRUD operations.

## Tech Stack

- React.js, Axios, React hooks, Vite
- Node.js, Express.js, MongoDB, Mongoose
- Multer uploads, CORS, dotenv
- Backend-only Gemini AI image analysis with the Google Gen AI SDK

## Project Structure

```text
api/
  index.js
backend/
  server.js
  .env.example
  config/db.js
  models/Expense.js
  routes/expenseRoutes.js
  controllers/expenseController.js
  middleware/uploadMiddleware.js
  services/aiService.js
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
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
```

4. Run both apps:

```bash
npm run dev
```

Backend: `http://localhost:5000`

Frontend: `http://localhost:5173`

## Vercel Deployment

This repository is now configured to deploy the React frontend and the serverless backend together on Vercel.

1. Add the required environment variables in the Vercel dashboard:
   - `MONGO_URI`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
   - `CLIENT_URL`
   - `LANGSMITH_TRACING`
   - `LANGSMITH_ENDPOINT`
   - `LANGSMITH_API_KEY`
   - `LANGSMITH_PROJECT`

2. Deploy using the Vercel CLI or GitHub integration.

3. The frontend will be served as the static app and `/api/expenses` will be handled by the serverless backend API.

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
4. The backend converts the image to base64 inline image data and sends it to Gemini through the Google Gen AI SDK.
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

- The Gemini API key is never sent to React.
- Use a Gemini vision-capable model for receipt images. The default is `gemini-2.5-flash`.
- Upload receipt images smaller than 3MB so image analysis stays fast and reliable.
- Uploaded files are served from `/uploads`.
- Deleting an expense also deletes its uploaded image from disk.
