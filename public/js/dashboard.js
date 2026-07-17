// Dashboard Client-Side Handling

// Track chart instances so we can recreate them on theme toggles
let studyChartInstance = null;
let expenseChartInstance = null;
let categoryChartInstance = null;

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

// Fetch dashboard aggregations
async function loadDashboardData() {
  try {
    const res = await fetch('/api/analytics/dashboard');
    if (!res.ok) {
      if (res.status === 401) return; // auth.js will handle redirect
      throw new Error('Failed to load dashboard aggregations.');
    }
    
    const data = await res.json();
    if (data.success) {
      updateCards(data.cards);
      updateProductivityScore(data.productivityScore);
      renderUpcomingDeadlines(data.widgets.upcomingDeadlines);
      renderRecentActivities(data.widgets.recentActivities);
      initializeCharts(data.charts);
    }
  } catch (error) {
    console.error('Error fetching dashboard datasets:', error);
    showToast('Failed to load dashboard statistics.', 'error');
  }
}

// Update card stats
function updateCards(cards) {
  document.getElementById('card-total-tasks').textContent = cards.totalTasks;
  document.getElementById('card-completed-tasks').textContent = cards.completedTasks;
  document.getElementById('card-pending-tasks').textContent = cards.pendingTasks;
  document.getElementById('card-study-hours').textContent = parseFloat(cards.totalStudyHours).toFixed(1);
  document.getElementById('card-monthly-expenses').textContent = `৳${parseFloat(cards.monthlyExpenses).toFixed(2)}`;
  document.getElementById('card-active-goals').textContent = cards.activeGoals;
  
  // Set initials on avatar
  const userName = document.querySelector('.user-display-name')?.textContent || 'S';
  const initial = userName.trim().charAt(0).toUpperCase();
  const avatar = document.getElementById('user-avatar');
  if (avatar) avatar.textContent = initial;
}

// Update productivity score widget
function updateProductivityScore(score) {
  document.getElementById('score-number').textContent = score;
  const progressPath = document.getElementById('score-radial-progress');
  if (progressPath) {
    progressPath.setAttribute('stroke-dasharray', `${score}, 100`);
  }

  const statusLabel = document.getElementById('score-status');
  if (statusLabel) {
    if (score >= 80) {
      statusLabel.textContent = 'Excellent';
      statusLabel.className = 'text-xs text-emerald-500 font-bold';
    } else if (score >= 50) {
      statusLabel.textContent = 'Good';
      statusLabel.className = 'text-xs text-indigo-500 font-bold';
    } else if (score >= 30) {
      statusLabel.textContent = 'Average';
      statusLabel.className = 'text-xs text-amber-500 font-bold';
    } else {
      statusLabel.textContent = 'Needs Work';
      statusLabel.className = 'text-xs text-rose-500 font-bold';
    }
  }
}

// Render Upcoming Deadlines Widget list
function renderUpcomingDeadlines(deadlines) {
  const container = document.getElementById('widget-deadlines');
  if (!container) return;

  if (!deadlines || deadlines.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No upcoming deadlines! Write some tasks.</p>';
    return;
  }

  container.innerHTML = deadlines.map(task => {
    // Format deadline date
    const dateObj = new Date(task.deadline);
    const options = { month: 'short', day: 'numeric' };
    const dateStr = dateObj.toLocaleDateString('en-US', options);

    // Priority class color mapping
    let priorityClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300';
    if (task.priority === 'High') {
      priorityClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    } else if (task.priority === 'Medium') {
      priorityClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    } else if (task.priority === 'Low') {
      priorityClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    }

    return `
      <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
        <div class="flex items-center gap-3">
          <input type="checkbox" class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800 dark:bg-slate-950 cursor-pointer" 
            onclick="quickCompleteTask(${task.task_id}, '${task.title}')">
          <div>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">${task.title}</p>
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">${task.status}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold px-2 py-0.5 rounded-md ${priorityClass}">${task.priority}</span>
          <span class="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md">${dateStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Quick complete task checkbox click
async function quickCompleteTask(taskId, title) {
  try {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Task "${title}" marked as completed!`, 'success');
      loadDashboardData(); // Refresh all aggregates
    } else {
      showToast(data.error || 'Failed to update task.', 'error');
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    showToast('Failed to connect to server.', 'error');
  }
}

// Render Recent Activities Logs list
function renderRecentActivities(logs) {
  const container = document.getElementById('widget-activities');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-500 dark:text-slate-400 text-center py-6">No recent logs recorded.</p>';
    return;
  }

  container.innerHTML = logs.map((log, index) => {
    // Icons & Colors based on activity type
    let colorClass = 'bg-slate-400 text-white';
    let iconSvg = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    
    if (log.activity_type === 'Create') {
      colorClass = 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25';
      iconSvg = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>';
    } else if (log.activity_type === 'Update') {
      colorClass = 'bg-amber-500 text-white shadow-md shadow-amber-500/25';
      iconSvg = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>';
    } else if (log.activity_type === 'Delete') {
      colorClass = 'bg-rose-500 text-white shadow-md shadow-rose-500/25';
      iconSvg = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
    } else if (log.activity_type === 'Complete') {
      colorClass = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25';
      iconSvg = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    }

    // Date/Time ago or format
    const logDate = new Date(log.created_at);
    const timeStr = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Show connector line if not last item
    const showLine = index !== logs.length - 1;

    return `
      <li>
        <div class="relative pb-6">
          ${showLine ? `<span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true"></span>` : ''}
          <div class="relative flex space-x-3">
            <div>
              <span class="h-8 w-8 rounded-xl ${colorClass} flex items-center justify-center ring-8 ring-slate-50 dark:ring-[#070b12] transition-all">
                ${iconSvg}
              </span>
            </div>
            <div class="flex-grow flex justify-between items-start gap-4">
              <div>
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">${log.description}</p>
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">${log.module_name}</span>
              </div>
              <div class="text-right whitespace-nowrap">
                <time class="text-xs text-slate-400 font-medium">${timeStr}</time>
              </div>
            </div>
          </div>
        </div>
      </li>
    `;
  }).join('');
}

// Chart Initializations
function initializeCharts(chartData) {
  const isDark = document.documentElement.classList.contains('dark');
  
  // Theme styling overrides for Chart.js
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(226, 232, 240, 0.6)';

  // Destroy previous instances to avoid canvas rendering glitches
  if (studyChartInstance) studyChartInstance.destroy();
  if (expenseChartInstance) expenseChartInstance.destroy();
  if (categoryChartInstance) categoryChartInstance.destroy();

  // 1. Weekly Study Chart (Bar Chart)
  const studyCtx = document.getElementById('weeklyStudyChart')?.getContext('2d');
  if (studyCtx) {
    const labels = chartData.weeklyStudy.map(d => d.weekday);
    const hours = chartData.weeklyStudy.map(d => parseFloat(d.total_hours));
    
    // Fallback if empty
    const displayLabels = labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const displayHours = hours.length ? hours : [0, 0, 0, 0, 0, 0, 0];

    studyChartInstance = new Chart(studyCtx, {
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

  // 2. Expense Trend Chart (Line Chart)
  const expenseCtx = document.getElementById('expenseTrendChart')?.getContext('2d');
  if (expenseCtx) {
    const labels = chartData.expenseTrend.map(d => d.month_label);
    const totals = chartData.expenseTrend.map(d => parseFloat(d.total));

    const displayLabels = labels.length ? labels : ['No Data'];
    const displayTotals = totals.length ? totals : [0];

    expenseChartInstance = new Chart(expenseCtx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [{
          label: 'Spent Amount',
          data: displayTotals,
          borderColor: 'rgb(244, 63, 94)',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: 'rgb(244, 63, 94)',
          pointHoverRadius: 6
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
            ticks: { 
              color: textColor,
              callback: value => '৳' + value
            }
          }
        }
      }
    });
  }

  // 3. Expense Categories Chart (Pie/Doughnut Chart)
  const categoryCtx = document.getElementById('expenseCategoryChart')?.getContext('2d');
  if (categoryCtx) {
    const labels = chartData.expenseCategories.map(d => d.category);
    const totals = chartData.expenseCategories.map(d => parseFloat(d.total));

    const displayLabels = labels.length ? labels : ['Food', 'Transport', 'Education', 'Entertainment', 'Others'];
    const displayTotals = totals.length ? totals : [0, 0, 0, 0, 0];
    const colors = [
      'rgba(99, 102, 241, 0.85)',  // Indigo
      'rgba(34, 197, 94, 0.85)',   // Green
      'rgba(245, 158, 11, 0.85)',  // Amber
      'rgba(239, 68, 68, 0.85)',   // Red
      'rgba(148, 163, 184, 0.85)'  // Slate
    ];

    categoryChartInstance = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: displayLabels,
        datasets: [{
          data: displayTotals,
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
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              boxWidth: 10,
              padding: 10,
              font: { size: 10 }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

// Watch theme changes to re-color graph labels
function watchThemeForCharts() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  
  themeToggleBtn.addEventListener('click', () => {
    // Wait briefly for dark mode class to write to DOM
    setTimeout(() => {
      loadDashboardData();
    }, 100);
  });
}

// Initialise dashboard components
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadDashboardData();
  watchThemeForCharts();
});
