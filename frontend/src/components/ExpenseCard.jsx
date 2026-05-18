import { getImageUrl } from '../api/expenseApi.js';

function ExpenseCard({ expense, onEdit, onDelete }) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(expense.amount || 0);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(expense.date));

  return (
    <article className="expense-card">
      <img
        className="expense-image"
        src={getImageUrl(expense.imageUrl)}
        alt={`${expense.merchantName} receipt`}
      />

      <div className="expense-content">
        <div className="expense-topline">
          <div>
            <h3>{expense.merchantName}</h3>
            <p>{formattedDate}</p>
          </div>
          <strong>{formattedAmount}</strong>
        </div>

        <div className="expense-meta">
          <span>{expense.category}</span>
        </div>

        <p className="description">{expense.description}</p>

        <div className="card-actions">
          <button type="button" className="ghost-button" onClick={() => onEdit(expense)}>
            Edit
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(expense._id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default ExpenseCard;
