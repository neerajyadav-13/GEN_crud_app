import ExpenseCard from './ExpenseCard.jsx';

function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses.length) {
    return (
      <section className="empty-state">
        <h2>No expenses found</h2>
        <p>Upload a receipt or adjust the search and category filters.</p>
      </section>
    );
  }

  return (
    <section className="expense-list" aria-label="Expense records">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense._id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}

export default ExpenseList;
