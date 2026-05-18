import fs from 'fs/promises';
import { EXPENSE_CATEGORIES } from '../models/Expense.js';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const detectMimeType = (buffer, fallbackMimeType) => {
  if (buffer.length >= 12) {
    const header = buffer.subarray(0, 12);

    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return 'image/png';
    }

    if (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    ) {
      return 'image/webp';
    }
  }

  return fallbackMimeType || 'image/jpeg';
};

const buildPrompt = () => `
You are an expert receipt and bill OCR extraction engine.

Analyze the uploaded bill or receipt image and return only one valid JSON object.
Do not return markdown.
Do not return code fences.
Do not return explanations.

Extract exactly this JSON shape:
{
  "merchantName": "",
  "amount": 0,
  "date": "",
  "category": "",
  "description": ""
}

Rules:
- If a field is unclear, use null.
- merchantName must be the store, vendor, hospital, fuel station, school, utility, or merchant name.
- amount must be the final payable total as a number, not a string.
- date must be in YYYY-MM-DD format if possible.
- category must be exactly one of: ${EXPENSE_CATEGORIES.join(', ')}.
- If category is unclear, use "Other".
- description must be a short plain-language summary of the purchase.
`;

const extractJsonObject = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('AI response was empty');
  }

  const cleaned = value
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('AI response did not contain a valid JSON object');
    }

    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const normalizeDate = (dateValue) => {
  if (!dateValue) return null;

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate.toISOString().slice(0, 10);
};

const normalizeExpense = (data) => {
  const parsedAmount = Number(data.amount);
  const category = EXPENSE_CATEGORIES.includes(data.category) ? data.category : 'Other';

  return {
    merchantName: data.merchantName ? String(data.merchantName).trim() : null,
    amount: Number.isFinite(parsedAmount) ? parsedAmount : null,
    date: normalizeDate(data.date),
    category,
    description: data.description ? String(data.description).trim() : null
  };
};

const parseGroqError = async (response) => {
  const errorText = await response.text();

  try {
    const parsedError = JSON.parse(errorText);
    return parsedError?.error?.message || parsedError?.message || errorText;
  } catch {
    return errorText;
  }
};

export const analyzeReceiptImage = async (filePath, uploadedMimeType) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_VISION_MODEL;

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is missing. Add your Groq API key in backend/.env.');
  }

  if (!model.includes('vision') && !model.includes('llama-4')) {
    throw new Error(`Configured Groq model "${model}" is not a vision-capable model.`);
  }

  let fileStats;
  let imageBuffer;

  try {
    fileStats = await fs.stat(filePath);
    imageBuffer = await fs.readFile(filePath);
  } catch {
    throw new Error(`Uploaded receipt image could not be read from path: ${filePath}`);
  }

  const detectedMimeType = detectMimeType(imageBuffer, uploadedMimeType);
  const base64Image = imageBuffer.toString('base64');
  const imageDataUrl = `data:${detectedMimeType};base64,${base64Image}`;

  console.log('[AI Upload Debug]', {
    filePath,
    uploadedMimeType,
    detectedMimeType,
    fileSizeBytes: fileStats.size,
    base64Length: base64Image.length,
    model
  });

  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildPrompt()
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      temperature: 0,
      max_completion_tokens: 700,
      response_format: {
        type: 'json_object'
      }
    })
  });

  if (!response.ok) {
    const message = await parseGroqError(response);
    console.error('[AI Error]', message);
    throw new Error(`Groq receipt analysis failed: ${message}`);
  }

  const result = await response.json();
  const rawText = result?.choices?.[0]?.message?.content;

  console.log('[AI Raw Response]', rawText);

  let parsedJson;
  try {
    parsedJson = extractJsonObject(rawText);
  } catch (error) {
    console.error('[AI Parse Error]', error.message);
    throw new Error(`Receipt analysis returned invalid JSON: ${error.message}`);
  }

  const normalizedExpense = normalizeExpense(parsedJson);
  console.log('[AI Parsed JSON]', normalizedExpense);

  return normalizedExpense;
};