import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/expenses`
});

export const uploadReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const analyzeReceipt = async (file) => {
  const formData = new FormData();
  formData.append('receipt', file);

  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const createExpense = async (expense) => {
  const response = await api.post('/', expense);
  return response.data;
};

export const getExpenses = async ({ category = 'All', search = '' } = {}) => {
  const response = await api.get('/', {
    params: {
      category,
      search
    }
  });

  return response.data;
};

export const updateExpense = async (id, expense) => {
  const response = await api.put(`/${id}`, expense);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};

export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  return `${API_BASE_URL}${imageUrl}`;
};
