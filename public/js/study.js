// Study Planner Page Management Client Script

let sessionToDelete = null;
let studyChartInstance = null;

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
async function loadStudyPlannerData() {
  try {
    // 1. Fetch study sessions list
    const listRes = await fetch('/api/study');
    if (!listRes.ok) {
      if (listRes.status === 401) return;
      throw new Error('Failed to fetch study sessions.');
    }
    const listData = await listRes.json();
    if (listData.success) {
      renderSessionsTable(listData.sessions);
    }

    // 2. Fetch study aggregates & charts
    const analyticRes = await fetch('/api/study/analytics');
    const analyticData = await analyticRes.json();
    if (analyticData.success) {
      updateSummaryWidgets(analyticData.analytics);
    }
  } catch (error) {
    console.error('Error loading study page details:', error);
    showToast('Failed to load study sessions.', 'error');
  }
}

// Render sessions list in log history table
function renderSessionsTable(sessions) {
  const tbody = document.getElementById('sessions-table-body');
  const emptyState = document.getElementById('study-empty-state');
  if (!tbody) return;

  if (!sessions || sessions.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  tbody.innerHTML = sessions.map(item => {
    const studyDate = new Date(item.study_date);
    const dateStr = studyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const notesStr = item.notes ? item.notes : '<span class="text-slate-400 dark:text-slate-600">-</span>';

    return `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all border-b border-slate-100 dark:border-slate-800/30">
        <td class="px-6 py-4.5 font-semibold text-slate-900 dark:text-slate-100">${item.subject_name}</td>
        <td class="px-6 py-4.5 text-slate-500 font-medium">${dateStr}</td>
        <td class="px-6 py-4.5 font-bold text-indigo-600 dark:text-indigo-400">${parseFloat(item.duration_hours).toFixed(2)} hrs</td>
        <td class="px-6 py-4.5 text-xs text-slate-500 dark:text-slate-400 max-w-sm truncate">${notesStr}</td>
        <td class="px-6 py-4.5 text-right">
          <div class="flex justify-end gap-1.5">
            <button onclick="openEditModal(${item.session_id})" class="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button onclick="confirmDelete(${item.session_id})" class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update study hours summary card and weekly performance chart
function updateSummaryWidgets(analytics) {
  document.getElementById('study-hours-total').innerHTML = `${parseFloat(analytics.totalHours).toFixed(2)} <span class="text-sm font-semibold text-slate-400">hours</span>`;

  const canvas = document.getElementById('weeklyStudyChart');
  if (!canvas) return;

  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(226, 232, 240, 0.6)';

  // Build weekly weekday datasets
  const labels = analytics.weeklyStats.map(d => d.weekday);
  const hours = analytics.weeklyStats.map(d => parseFloat(d.total_hours));

  const displayLabels = labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const displayHours = hours.length ? hours : [0, 0, 0, 0, 0, 0, 0];

  // Destroy previous chart
  if (studyChartInstance) studyChartInstance.destroy();

  const ctx = canvas.getContext('2d');
  studyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: displayLabels,
      datasets: [{
        label: 'Study Hours',
        data: displayHours,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, precision: 1 }
        }
      }
    }
  });
}

// Modal handling
const studyModal = document.getElementById('study-modal');
const studyForm = document.getElementById('study-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Log Study Session';
  document.getElementById('session-id').value = '';
  studyForm.reset();
  
  // Set default date to today
  document.getElementById('study-date').value = new Date().toISOString().substring(0, 10);
  
  studyModal.classList.remove('hidden');
}

async function openEditModal(sessionId) {
  try {
    const res = await fetch(`/api/study/${sessionId}`);
    const data = await res.json();
    if (data.success) {
      const sess = data.session;
      document.getElementById('modal-title').textContent = 'Edit Study Session Details';
      document.getElementById('session-id').value = sess.session_id;
      document.getElementById('study-subject').value = sess.subject_name;
      document.getElementById('study-hours').value = sess.duration_hours;
      document.getElementById('study-notes').value = sess.notes || '';
      document.getElementById('study-date').value = sess.study_date.substring(0, 10);
      
      studyModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load study details.', 'error');
    }
  } catch (error) {
    console.error('Error loading study session details:', error);
    showToast('Failed to load study session details.', 'error');
  }
}

function closeModal() {
  studyModal.classList.add('hidden');
}

// Form submissions
studyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('session-id').value;
  const subject_name = document.getElementById('study-subject').value;
  const duration_hours = document.getElementById('study-hours').value;
  const study_date = document.getElementById('study-date').value;
  const notes = document.getElementById('study-notes').value;

  const url = id ? `/api/study/${id}` : '/api/study';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject_name, duration_hours, study_date, notes })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Session logged updated!' : 'Study hours logged successfully!', 'success');
      closeModal();
      loadStudyPlannerData(); // Refresh history logs & charts
    } else {
      showToast(data.error || 'Failed to log study session.', 'error');
    }
  } catch (error) {
    console.error('Error saving session details:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(sessionId) {
  sessionToDelete = sessionId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  sessionToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!sessionToDelete) return;
  try {
    const res = await fetch(`/api/study/${sessionToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Study session log deleted.', 'success');
      closeDeleteModal();
      loadStudyPlannerData();
    } else {
      showToast(data.error || 'Failed to delete entry.', 'error');
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Hooks
document.getElementById('btn-add-session').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Watch theme toggles to repaint chart grids
function watchThemeForCharts() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  themeToggleBtn.addEventListener('click', () => {
    setTimeout(() => {
      loadStudyPlannerData();
    }, 100);
  });
}

// Initialise
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadStudyPlannerData();
  watchThemeForCharts();
});
