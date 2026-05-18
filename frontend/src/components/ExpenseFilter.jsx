const categories = [
  'All',
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

function ExpenseFilter({ category, search, onCategoryChange, onSearchChange }) {
  return (
    <section className="toolbar" aria-label="Expense filters">
      <div className="field search-field">
        <label htmlFor="search">Search merchant</label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by merchant name"
        />
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default ExpenseFilter;
