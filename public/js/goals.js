// Goals Tracker Page Management Client Script

let goalToDelete = null;

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

// Fetch all user goals on page load
async function loadGoals() {
  try {
    const res = await fetch('/api/goals');
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch goals.');
    }
    const data = await res.json();
    if (data.success) {
      renderGoals(data.goals);
    }
  } catch (error) {
    console.error('Error fetching goals list:', error);
    showToast('Failed to load goals tracker list.', 'error');
  }
}

// Render goal cards
function renderGoals(goals) {
  const container = document.getElementById('goals-list');
  const emptyState = document.getElementById('goals-empty-state');
  if (!container) return;

  if (!goals || goals.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = goals.map(item => {
    // Badges based on status
    const isCompleted = item.status === 'Completed' || item.progress_percentage === 100;
    const badgeClass = isCompleted 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
      : 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    const statusText = isCompleted ? 'Completed' : 'Active';

    // Deadline formatting
    const deadlineDate = new Date(item.deadline);
    const dateStr = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Calculate days remaining
    const diffTime = deadlineDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let timeLabel = `${diffDays} days left`;
    if (isCompleted) {
      timeLabel = 'Goal Achieved! 🎉';
    } else if (diffDays < 0) {
      timeLabel = `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      timeLabel = 'Due today!';
    }

    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between h-64 transition-all">
        <div>
          <!-- Header (Title & Badges) -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 w-[75%]">${item.title}</h4>
            <div class="flex items-center gap-1">
              <button onclick="openEditModal(${item.goal_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${item.goal_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <div class="flex gap-2 mb-4">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeClass}">${statusText}</span>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">${dateStr}</span>
          </div>
        </div>

        <div>
          <!-- Progress representation -->
          <div class="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Target Progress</span>
            <span class="text-indigo-600 dark:text-indigo-400 font-bold" id="progress-val-${item.goal_id}">${item.progress_percentage}%</span>
          </div>
          
          <!-- Animated Progress bar -->
          <div class="w-full bg-slate-200 dark:bg-slate-800/60 rounded-full h-2 mb-4 overflow-hidden">
            <div id="progress-bar-${item.goal_id}" class="bg-[#0EA5E9] h-2 rounded-full transition-all duration-500" style="width: ${item.progress_percentage}%"></div>
          </div>

          <!-- Slider controllers for fast on-the-go progress updates -->
          <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/20">
            <input type="range" min="0" max="100" value="${item.progress_percentage}" 
              class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9] focus:outline-none"
              oninput="updateProgressBarVal(${item.goal_id}, this.value)"
              onchange="saveGoalProgress(${item.goal_id}, this.value, '${item.title}')">
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold mt-3">
          <div class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>${timeLabel}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Update the progress UI dynamically while dragging slider
function updateProgressBarVal(goalId, val) {
  document.getElementById(`progress-val-${goalId}`).textContent = `${val}%`;
  document.getElementById(`progress-bar-${goalId}`).style.width = `${val}%`;
}

// Save slider drag changes to DB via PATCH request
async function saveGoalProgress(goalId, val, title) {
  try {
    const res = await fetch(`/api/goals/${goalId}/progress`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress_percentage: val })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Updated progress for "${title}" to ${val}%.`, 'success');
      loadGoals(); // Refresh goal status badges
    } else {
      showToast(data.error || 'Failed to update goal progress.', 'error');
    }
  } catch (error) {
    console.error('Error saving progress slider:', error);
    showToast('Failed to connect to server.', 'error');
  }
}

// Modal forms toggle controllers
const goalModal = document.getElementById('goal-modal');
const goalForm = document.getElementById('goal-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Set New Goal';
  document.getElementById('goal-id').value = '';
  goalForm.reset();
  
  // Set default deadline date (e.g. 30 days out)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 30);
  document.getElementById('goal-deadline').value = targetDate.toISOString().substring(0, 10);
  
  goalModal.classList.remove('hidden');
}

async function openEditModal(goalId) {
  try {
    const res = await fetch(`/api/goals/${goalId}`);
    const data = await res.json();
    if (data.success) {
      const goal = data.goal;
      document.getElementById('modal-title').textContent = 'Edit Goal Details';
      document.getElementById('goal-id').value = goal.goal_id;
      document.getElementById('goal-title').value = goal.title;
      document.getElementById('goal-deadline').value = goal.deadline.substring(0, 10);
      document.getElementById('goal-progress').value = goal.progress_percentage;
      
      goalModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load goal.', 'error');
    }
  } catch (error) {
    console.error('Error loading goal details:', error);
    showToast('Error loading details.', 'error');
  }
}

function closeModal() {
  goalModal.classList.add('hidden');
}

// Form submissions
goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('goal-id').value;
  const title = document.getElementById('goal-title').value;
  const deadline = document.getElementById('goal-deadline').value;
  const progress_percentage = document.getElementById('goal-progress').value;

  const url = id ? `/api/goals/${id}` : '/api/goals';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, deadline, progress_percentage })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Goal updated successfully!' : 'Goal created successfully!', 'success');
      closeModal();
      loadGoals(); // Reload goal cards grid
    } else {
      showToast(data.error || 'Failed to save goal details.', 'error');
    }
  } catch (error) {
    console.error('Error saving goal:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(goalId) {
  goalToDelete = goalId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  goalToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!goalToDelete) return;
  try {
    const res = await fetch(`/api/goals/${goalToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Goal record removed successfully.', 'success');
      closeDeleteModal();
      loadGoals();
    } else {
      showToast(data.error || 'Failed to delete goal.', 'error');
    }
  } catch (error) {
    console.error('Error deleting goal:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Hooks
document.getElementById('btn-add-goal').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Initialise
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadGoals();
});
