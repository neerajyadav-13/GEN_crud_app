import fs from 'fs/promises';
import { GoogleGenAI } from '@google/genai';
import { EXPENSE_CATEGORIES } from '../models/Expense.js';

const DEFAULT_GEMINI_VISION_MODEL = 'gemini-2.5-flash';

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

export const analyzeReceiptImage = async ({ filePath, imageBuffer, uploadedMimeType }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_VISION_MODEL;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add your Gemini API key in backend/.env.');
  }

  let buffer;

  if (imageBuffer) {
    buffer = imageBuffer;
  } else if (filePath) {
    try {
      buffer = await fs.readFile(filePath);
    } catch {
      throw new Error(`Uploaded receipt image could not be read from path: ${filePath}`);
    }
  } else {
    throw new Error('No receipt image provided for analysis');
  }

  const detectedMimeType = detectMimeType(buffer, uploadedMimeType);
  const base64Image = buffer.toString('base64');

  console.log('[AI Upload Debug]', {
    filePath,
    uploadedMimeType,
    detectedMimeType,
    fileSizeBytes: buffer.length,
    base64Length: base64Image.length,
    model
  });

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType: detectedMimeType,
            data: base64Image
          }
        },
        {
          text: buildPrompt()
        }
      ],
      config: {
        temperature: 0,
        responseMimeType: 'application/json'
      }
    });
  } catch (error) {
    console.error('[AI Error]', error);
    const errorMessage = `Gemini receipt analysis failed: ${error.message}`;
    const aiError = new Error(errorMessage);

    if (
      error.code === 403 ||
      typeof error.message === 'string' &&
      error.message.toLowerCase().includes('permission_denied')
    ) {
      aiError.statusCode = 403;
    }

    throw aiError;
  }

  const rawText = response.text;
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
