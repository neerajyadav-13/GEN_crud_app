import { useEffect, useState } from 'react';
import { getImageUrl } from '../api/expenseApi.js';

const categories = [
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

const emptyForm = {
  merchantName: '',
  amount: '',
  date: '',
  category: 'Other',
  description: ''
};

const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toISOString().slice(0, 10);
};

function ExpenseForm({
  selectedExpense,
  selectedFile,
  previewUrl,
  isAnalyzing,
  onFileChange,
  onAnalyze,
  onSave,
  onCancelEdit
}) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!selectedExpense) {
      setFormData(emptyForm);
      return;
    }

    setFormData({
      merchantName: selectedExpense.merchantName || '',
      amount: selectedExpense.amount ?? '',
      date: formatDateForInput(selectedExpense.date),
      category: selectedExpense.category || 'Other',
      description: selectedExpense.description || ''
    });
  }, [selectedExpense]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedExpense?.imageUrl) return;
    onSave(selectedExpense._id, formData);
  };

  const imagePreview = previewUrl || getImageUrl(selectedExpense?.imageUrl);

  return (
    <section className="form-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AI receipt capture</p>
          <h2>Upload and review</h2>
        </div>
      </div>

      <div className="upload-panel">
        <label className="drop-zone" htmlFor="receipt">
          {imagePreview ? (
            <img src={imagePreview} alt="Receipt preview" />
          ) : (
            <span>Select a bill or receipt image</span>
          )}
          <input
            id="receipt"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={onFileChange}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          onClick={onAnalyze}
          disabled={!selectedFile || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze receipt'}
        </button>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="merchantName">Merchant name</label>
            <input
              id="merchantName"
              name="merchantName"
              value={formData.merchantName}
              onChange={handleInputChange}
              placeholder="Merchant or store"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="form-category">Category</label>
            <select
              id="form-category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Short expense description"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={!selectedExpense?.imageUrl}>
            {selectedExpense?._id ? 'Save changes' : 'Save expense'}
          </button>
          <button type="button" className="ghost-button" onClick={onCancelEdit}>
            Clear form
          </button>
        </div>
      </form>
    </section>
  );
}

export default ExpenseForm;
