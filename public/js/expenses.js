// Expenses Page Management Client Script

let expenseToDelete = null;
let categoryChartInstance = null;

// Color maps matching CSS variables
const categoryColors = {
  Food: 'rgba(99, 102, 241, 0.85)',       // Indigo
  Transport: 'rgba(34, 197, 94, 0.85)',    // Green
  Education: 'rgba(245, 158, 11, 0.85)',   // Amber
  Entertainment: 'rgba(239, 68, 68, 0.85)',// Red
  Others: 'rgba(148, 163, 184, 0.85)'      // Slate
};

const categoryBadgeColors = {
  Food: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  Transport: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Education: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Entertainment: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  Others: 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
};

// Mobile sidebar controls
function setupMobileSidebar() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  if (!toggleBtn || !sidebar || !overlay) return;

  function toggleMenu() {
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
  }

  toggleBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);
}

// Fetch and load page datasets
async function loadExpensesData() {
  try {
    // 1. Fetch expenses list
    const listRes = await fetch('/api/expenses');
    if (!listRes.ok) {
      if (listRes.status === 401) return;
      throw new Error('Failed to fetch expenses list.');
    }
    const listData = await listRes.json();
    if (listData.success) {
      renderExpensesTable(listData.expenses);
    }

    // 2. Fetch aggregates & charts
    const analyticRes = await fetch('/api/expenses/analytics');
    const analyticData = await analyticRes.json();
    if (analyticData.success) {
      updateSummaryWidgets(analyticData.analytics);
    }
  } catch (error) {
    console.error('Error loading expenses page data:', error);
    showToast('Failed to load expenses data.', 'error');
  }
}

// Render financial rows in history log table
function renderExpensesTable(expenses) {
  const tbody = document.getElementById('expenses-table-body');
  const emptyState = document.getElementById('expenses-empty-state');
  if (!tbody) return;

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tbody.innerHTML = expenses.map(item => {
    const expenseDate = new Date(item.expense_date);
    const dateStr = expenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const notesStr = item.notes ? item.notes : '<span class="text-slate-400 dark:text-slate-600">-</span>';
    const badgeClass = categoryBadgeColors[item.category] || categoryBadgeColors.Others;

    return `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all border-b border-slate-100 dark:border-slate-800/30">
        <td class="px-6 py-4.5 font-semibold text-slate-900 dark:text-slate-100">${item.title}</td>
        <td class="px-6 py-4.5">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-md ${badgeClass}">${item.category}</span>
        </td>
        <td class="px-6 py-4.5 font-bold text-rose-500">৳${parseFloat(item.amount).toFixed(2)}</td>
        <td class="px-6 py-4.5 text-slate-500 font-medium">${dateStr}</td>
        <td class="px-6 py-4.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">${notesStr}</td>
        <td class="px-6 py-4.5 text-right">
          <div class="flex justify-end gap-1.5">
            <button onclick="openEditModal(${item.expense_id})" class="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button onclick="confirmDelete(${item.expense_id})" class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update text cards and load Chart.js distributions
function updateSummaryWidgets(analytics) {
  document.getElementById('monthly-spend-total').textContent = `৳${parseFloat(analytics.monthlyTotal).toFixed(2)}`;

  // Prepare and construct category doughnut chart
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#cbd5e1' : '#475569';

  // Format array
  const categoriesList = ['Food', 'Transport', 'Education', 'Entertainment', 'Others'];
  const totalsMap = {};
  
  // Set default zeroes
  categoriesList.forEach(c => totalsMap[c] = 0);
  analytics.categoryTotals.forEach(item => {
    if (totalsMap[item.category] !== undefined) {
      totalsMap[item.category] = parseFloat(item.total);
    }
  });

  const chartLabels = categoriesList;
  const chartData = categoriesList.map(c => totalsMap[c]);
  const colors = categoriesList.map(c => categoryColors[c]);

  // Re-draw legend cards manually to look premium
  const legendContainer = document.getElementById('chart-legend-container');
  if (legendContainer) {
    legendContainer.innerHTML = categoriesList.map(c => {
      const amt = totalsMap[c].toFixed(2);
      let textBadgeDot = '';
      if (c === 'Food') textBadgeDot = 'bg-indigo-500';
      else if (c === 'Transport') textBadgeDot = 'bg-emerald-500';
      else if (c === 'Education') textBadgeDot = 'bg-amber-500';
      else if (c === 'Entertainment') textBadgeDot = 'bg-rose-500';
      else textBadgeDot = 'bg-slate-400';

      return `
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${textBadgeDot}"></span>
          <span class="font-medium text-slate-600 dark:text-slate-400">${c}:</span>
          <span class="font-bold text-slate-800 dark:text-slate-200">৳${amt}</span>
        </div>
      `;
    }).join('');
  }

  // Destroy previous chart
  if (categoryChartInstance) categoryChartInstance.destroy();

  const ctx = canvas.getContext('2d');
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: colors,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      cutout: '65%'
    }
  });
}

// Modal Toggle controllers
const expenseModal = document.getElementById('expense-modal');
const expenseForm = document.getElementById('expense-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Log New Expense';
  document.getElementById('expense-id').value = '';
  expenseForm.reset();
  
  // Set default date to today
  document.getElementById('expense-date').value = new Date().toISOString().substring(0, 10);
  
  expenseModal.classList.remove('hidden');
}

async function openEditModal(expenseId) {
  try {
    const res = await fetch(`/api/expenses/${expenseId}`);
    const data = await res.json();
    if (data.success) {
      const exp = data.expense;
      document.getElementById('modal-title').textContent = 'Edit Expense Details';
      document.getElementById('expense-id').value = exp.expense_id;
      document.getElementById('expense-title').value = exp.title;
      document.getElementById('expense-amount').value = exp.amount;
      document.getElementById('expense-category').value = exp.category;
      document.getElementById('expense-notes').value = exp.notes || '';
      document.getElementById('expense-date').value = exp.expense_date.substring(0, 10);
      
      expenseModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load expense details.', 'error');
    }
  } catch (error) {
    console.error('Error fetching expense details:', error);
    showToast('Failed to load expense details.', 'error');
  }
}

function closeModal() {
  expenseModal.classList.add('hidden');
}

// Form submissions
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('expense-id').value;
  const title = document.getElementById('expense-title').value;
  const amount = document.getElementById('expense-amount').value;
  const category = document.getElementById('expense-category').value;
  const expense_date = document.getElementById('expense-date').value;
  const notes = document.getElementById('expense-notes').value;

  const url = id ? `/api/expenses/${id}` : '/api/expenses';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, category, expense_date, notes })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Expense details updated!' : 'Expense recorded successfully!', 'success');
      closeModal();
      loadExpensesData(); // Refresh history table list & charts
    } else {
      showToast(data.error || 'Failed to log expense.', 'error');
    }
  } catch (error) {
    console.error('Error logging expense:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(expenseId) {
  expenseToDelete = expenseId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  expenseToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!expenseToDelete) return;
  try {
    const res = await fetch(`/api/expenses/${expenseToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Expense record deleted successfully.', 'success');
      closeDeleteModal();
      loadExpensesData();
    } else {
      showToast(data.error || 'Failed to delete record.', 'error');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Hooks
document.getElementById('btn-add-expense').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Watch theme changes to refresh chart labels
function watchThemeForCharts() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  themeToggleBtn.addEventListener('click', () => {
    setTimeout(() => {
      loadExpensesData();
    }, 100);
  });
}

// Initialise
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadExpensesData();
  watchThemeForCharts();
});
