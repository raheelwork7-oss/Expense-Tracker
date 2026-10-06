// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [
  { id: 1, name: 'Monthly Salary', amount: 8200.00, type: 'income', category: 'Salary', date: '2026-03-01', paymentMethod: 'Bank Transfer' },
  { id: 2, name: 'Grocery Market', amount: 150.50, type: 'expense', category: 'Food', date: '2026-03-02', paymentMethod: 'Credit Card' },
  { id: 3, name: 'Electricity Bill', amount: 120.00, type: 'expense', category: 'Bills', date: '2026-03-03', paymentMethod: 'Debit Card' },
  { id: 4, name: 'Train Pass', amount: 90.00, type: 'expense', category: 'Transport', date: '2026-03-05', paymentMethod: 'Debit Card' },
  { id: 5, name: 'Weekend Dining', amount: 210.30, type: 'expense', category: 'Food', date: '2026-03-09', paymentMethod: 'Credit Card' },
  { id: 6, name: 'Internet Bill', amount: 95.00, type: 'expense', category: 'Bills', date: '2026-03-10', paymentMethod: 'Bank Transfer' }
];

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const totalSavingsEl = document.getElementById('totalSavings');
const searchInput = document.getElementById('searchInput');
const categoryBreakdownEl = document.getElementById('categoryBreakdown');
const navLinks = document.querySelectorAll('.nav-link');
const viewPanels = document.querySelectorAll('.view-panel');

function showView(targetView) {
  viewPanels.forEach(panel => {
    const isActive = panel.dataset.view === targetView;
    panel.classList.toggle('active', isActive);
  });

  navLinks.forEach(link => {
    const isActive = link.dataset.view === targetView;
    link.classList.toggle('active', isActive);
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showView(link.dataset.view);
  });
});

// Set default date input to today
document.getElementById('date').valueAsDate = new Date();

// Initialize App
function init() {
  renderTransactions();
  updateSummary();
}

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Render Transactions Table
function renderTransactions(filterText = '') {
  transactionList.innerHTML = '';

  const filtered = transactions.filter(t => 
    t.name.toLowerCase().includes(filterText.toLowerCase()) || 
    t.category.toLowerCase().includes(filterText.toLowerCase())
  );

  if (filtered.length === 0) {
    transactionList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">No transactions found.</td></tr>`;
    return;
  }

  filtered.forEach(t => {
    const row = document.createElement('tr');
    const isIncome = t.type === 'income';

    row.innerHTML = `
      <td><strong>${t.name}</strong></td>
      <td><span class="badge" style="background: rgba(148, 163, 184, 0.12); color: var(--text-primary);">${t.category}</span></td>
      <td>${t.date}</td>
      <td>${t.paymentMethod}</td>
      <td class="${isIncome ? 'amount-income' : 'amount-expense'}">
        ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
      </td>
      <td>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})" aria-label="Delete transaction">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    `;
    transactionList.appendChild(row);
  });
}

function updateCategoryBreakdown() {
  const expenseBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + item.amount;
      return accumulator;
    }, {});

  const totalExpenseValue = Object.values(expenseBreakdown).reduce((sum, value) => sum + value, 0) || 1;
  const colors = {
    Food: 'fill-food',
    Shopping: 'fill-shopping',
    Bills: 'fill-bills',
    Transport: 'fill-transport',
    Entertainment: 'fill-entertainment'
  };

  categoryBreakdownEl.innerHTML = Object.entries(expenseBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, value]) => {
      const percent = Math.round((value / totalExpenseValue) * 100);
      const fillClass = colors[category] || 'fill-bills';
      return `
        <div class="progress-item">
          <div class="progress-info">
            <span>${category}</span>
            <span>${formatCurrency(value)} (${percent}%)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${fillClass}" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Update Totals
function updateSummary() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expenses;
  const savings = Math.max(balance, 0);

  totalIncomeEl.textContent = formatCurrency(income);
  totalExpensesEl.textContent = formatCurrency(expenses);
  totalBalanceEl.textContent = formatCurrency(balance);
  totalSavingsEl.textContent = formatCurrency(savings);

  updateCategoryBreakdown();
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add New Transaction Event
transactionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const newTransaction = {
    id: Date.now(),
    name: document.getElementById('name').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    type: document.getElementById('type').value,
    category: document.getElementById('category').value,
    date: document.getElementById('date').value,
    paymentMethod: document.getElementById('paymentMethod').value
  };

  if (!newTransaction.name || Number.isNaN(newTransaction.amount) || newTransaction.amount <= 0 || !newTransaction.date) {
    return;
  }

  transactions.unshift(newTransaction);
  init();
  transactionForm.reset();
  document.getElementById('date').valueAsDate = new Date();
});

// Delete Transaction
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  init();
}

// Search Filter Event
searchInput.addEventListener('input', (e) => {
  renderTransactions(e.target.value);
});

// Run Application
init();