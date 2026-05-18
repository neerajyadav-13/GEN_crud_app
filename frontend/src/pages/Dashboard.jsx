import { useEffect, useMemo, useState } from 'react';
import {
  analyzeReceipt,
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense
} from '../api/expenseApi.js';
import ExpenseFilter from '../components/ExpenseFilter.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import ExpenseSummary from '../components/ExpenseSummary.jsx';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getExpenses({ category, search });
      setExpenses(data.expenses);
      setTotal(data.total);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Could not load expenses'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [category, search]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
    setSelectedExpense(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAlert(null);

    try {
      const data = await analyzeReceipt(selectedFile);
      setSelectedExpense(data.expense);
      setAlert({
        type: 'success',
        message: 'Receipt analyzed. Review the extracted fields, then save the expense.'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Receipt analysis failed'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (id, formData) => {
    try {
      const data = id
        ? await updateExpense(id, formData)
        : await createExpense({
            ...formData,
            imageUrl: selectedExpense.imageUrl
          });

      setSelectedExpense(data.expense);
      setAlert({
        type: 'success',
        message: id ? 'Expense updated successfully' : 'Expense saved successfully'
      });
      await loadExpenses();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Could not save expense'
      });
    }
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm('Delete this expense and its uploaded receipt image?');
    if (!shouldDelete) return;

    try {
      await deleteExpense(id);
      if (selectedExpense?._id === id) {
        handleCancelEdit();
      }
      setAlert({
        type: 'success',
        message: 'Expense deleted successfully'
      });
      await loadExpenses();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Could not delete expense'
      });
    }
  };

  const handleEdit = (expense) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl('');
    setSelectedFile(null);
    setSelectedExpense(expense);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl('');
    setSelectedFile(null);
    setSelectedExpense(null);
  };

  const statusText = useMemo(() => {
    if (isAnalyzing) return 'AI is reading receipt details';
    if (isLoading) return 'Refreshing expenses';
    return '';
  }, [isAnalyzing, isLoading]);

  return (
    <main className="dashboard">
      <header className="app-header">
        <div>
          <p className="eyebrow">Generative CRUD</p>
          <h1>Expense Tracker</h1>
          <p className="header-copy">
            Upload receipts, extract the details with AI, correct the fields, and keep spending organized.
          </p>
        </div>
      </header>

      {alert && (
        <div className={`alert ${alert.type}`} role="status">
          {alert.message}
        </div>
      )}

      {statusText && <div className="status-line">{statusText}</div>}

      <div className="dashboard-grid">
        <ExpenseForm
          selectedExpense={selectedExpense}
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          isAnalyzing={isAnalyzing}
          onFileChange={handleFileChange}
          onAnalyze={handleAnalyze}
          onSave={handleSave}
          onCancelEdit={handleCancelEdit}
        />

        <aside className="side-panel">
          <ExpenseSummary total={total} count={expenses.length} />
          <ExpenseFilter
            category={category}
            search={search}
            onCategoryChange={setCategory}
            onSearchChange={setSearch}
          />
        </aside>
      </div>

      <ExpenseList expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}

export default Dashboard;
