// Tasks Page Management Client Script

let taskToDelete = null;

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

// Fetch and render tasks with filter queries
async function loadTasks() {
  try {
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const sortBy = document.getElementById('sort-by').value;

    const queryParams = new URLSearchParams({
      search,
      status,
      priority,
      sortBy
    });

    const res = await fetch(`/api/tasks?${queryParams.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch tasks.');
    }

    const data = await res.json();
    if (data.success) {
      renderTasks(data.tasks);
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
    showToast('Failed to load tasks list.', 'error');
  }
}

// Render task card grids
function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  const emptyState = document.getElementById('tasks-empty-state');
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = tasks.map(task => {
    // Priority badge styles
    let priorityClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300';
    if (task.priority === 'High') {
      priorityClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    } else if (task.priority === 'Medium') {
      priorityClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    } else if (task.priority === 'Low') {
      priorityClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    }

    // Status badge styles
    let statusClass = 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400';
    if (task.status === 'Completed') {
      statusClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    } else if (task.status === 'In Progress') {
      statusClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
    }

    // Format deadline
    let deadlineBadge = '';
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const isOverdue = deadlineDate < new Date() && task.status !== 'Completed';
      const formattedDate = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      deadlineBadge = `
        <div class="flex items-center gap-1 text-xs font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>
        </div>
      `;
    }

    const isCompleted = task.status === 'Completed';

    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between h-56 transition-all ${isCompleted ? 'opacity-70' : ''}">
        <div>
          <!-- Header (Checkbox + Title + Actions) -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 w-[78%]">
              <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                class="w-4.5 h-4.5 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800 dark:bg-slate-950 cursor-pointer"
                onclick="toggleTaskCompletion(${task.task_id}, this.checked, '${task.title}')">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}">${task.title}</h4>
            </div>
            
            <!-- Card actions -->
            <div class="flex items-center gap-1.5">
              <button onclick="openEditModal(${task.task_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${task.task_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <!-- Description -->
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 pl-7.5">${task.description || '<i>No description provided.</i>'}</p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pl-7.5 pt-4 border-t border-slate-100 dark:border-slate-800/30">
          ${deadlineBadge || '<div></div>'}
          <div class="flex gap-2">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${priorityClass}">${task.priority}</span>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusClass}">${task.status}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Checkbox change trigger
async function toggleTaskCompletion(taskId, isChecked, title) {
  try {
    const status = isChecked ? 'Completed' : 'Pending';
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(`Task "${title}" marked as ${status}.`, 'success');
      loadTasks(); // Refetch task grid list
    } else {
      showToast(data.error || 'Failed to update task status.', 'error');
    }
  } catch (error) {
    console.error('Error toggling status:', error);
    showToast('Failed to connect to server.', 'error');
  }
}

// Modal handling logic
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add New Task';
  document.getElementById('task-id').value = '';
  taskForm.reset();
  
  // Set default deadline date (e.g. tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('task-deadline').value = tomorrow.toISOString().substring(0, 10);
  
  taskModal.classList.remove('hidden');
}

async function openEditModal(taskId) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`);
    const data = await res.json();
    if (data.success) {
      const task = data.task;
      document.getElementById('modal-title').textContent = 'Edit Task Details';
      document.getElementById('task-id').value = task.task_id;
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-desc').value = task.description || '';
      document.getElementById('task-priority').value = task.priority;
      document.getElementById('task-status').value = task.status;
      
      if (task.deadline) {
        // Parse date from YYYY-MM-DD
        document.getElementById('task-deadline').value = task.deadline.substring(0, 10);
      } else {
        document.getElementById('task-deadline').value = '';
      }
      
      taskModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load task details.', 'error');
    }
  } catch (error) {
    console.error('Error loading task details:', error);
    showToast('Failed to load task details.', 'error');
  }
}

function closeModal() {
  taskModal.classList.add('hidden');
}

// Handle Form Submission
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('task-id').value;
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-desc').value;
  const priority = document.getElementById('task-priority').value;
  const status = document.getElementById('task-status').value;
  const deadline = document.getElementById('task-deadline').value;

  const url = id ? `/api/tasks/${id}` : '/api/tasks';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, status, deadline })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Task updated successfully!' : 'Task created successfully!', 'success');
      closeModal();
      loadTasks(); // Reload task listing grid
    } else {
      showToast(data.error || 'Failed to save task details.', 'error');
    }
  } catch (error) {
    console.error('Error saving task:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation Modals
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(taskId) {
  taskToDelete = taskId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  taskToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!taskToDelete) return;
  try {
    const res = await fetch(`/api/tasks/${taskToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Task deleted successfully.', 'success');
      closeDeleteModal();
      loadTasks();
    } else {
      showToast(data.error || 'Failed to delete task.', 'error');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Listeners
document.getElementById('btn-add-task').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Instant Filter/Search event hooks
document.getElementById('search-input').addEventListener('input', loadTasks);
document.getElementById('filter-status').addEventListener('change', loadTasks);
document.getElementById('filter-priority').addEventListener('change', loadTasks);
document.getElementById('sort-by').addEventListener('change', loadTasks);

// Init call
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadTasks();
});
