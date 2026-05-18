function ExpenseSummary({ total, count }) {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(total || 0);

  return (
    <section className="summary-grid" aria-label="Expense summary">
      <div className="summary-panel">
        <span>Total spending</span>
        <strong>{formattedTotal}</strong>
      </div>
      <div className="summary-panel">
        <span>Tracked expenses</span>
        <strong>{count}</strong>
      </div>
    </section>
  );
}

export default ExpenseSummary;
