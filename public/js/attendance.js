// Attendance Page Management Client Script

let attendanceToDelete = null;

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

// Fetch and render attendance with filter queries
async function loadAttendance() {
  try {
    const search = document.getElementById('search-input').value;
    const sortBy = document.getElementById('sort-by').value;

    const queryParams = new URLSearchParams({
      search,
      sortBy
    });

    const res = await fetch(`/api/attendance?${queryParams.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch attendance.');
    }

    const data = await res.json();
    if (data.success) {
      renderAttendance(data.attendance);
    }
  } catch (error) {
    console.error('Error loading attendance:', error);
    showToast('Failed to load attendance records.', 'error');
  }
}

// Render attendance cards
function renderAttendance(attendanceRecords) {
  const container = document.getElementById('attendance-list');
  const emptyState = document.getElementById('attendance-empty-state');
  if (!container) return;

  if (!attendanceRecords || attendanceRecords.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = attendanceRecords.map(record => {
    // Status badge styles
    let statusClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300';
    if (record.status === 'Present') {
      statusClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    } else if (record.status === 'Absent') {
      statusClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    } else if (record.status === 'Late') {
      statusClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    }

    // Format date
    const date = new Date(record.date);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between transition-all">
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 w-[78%]">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">${record.subject}</h4>
            </div>
            
            <!-- Card actions -->
            <div class="flex items-center gap-1.5">
              <button onclick="openEditModal(${record.attendance_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${record.attendance_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/30">
          <div class="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>${formattedDate}</span>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusClass}">${record.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Modal handling logic
const attendanceModal = document.getElementById('attendance-modal');
const attendanceForm = document.getElementById('attendance-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Attendance';
  document.getElementById('attendance-id').value = '';
  attendanceForm.reset();
  
  // Set default date to today
  document.getElementById('attendance-date').value = new Date().toISOString().substring(0, 10);
  
  attendanceModal.classList.remove('hidden');
}

async function openEditModal(attendanceId) {
  try {
    const res = await fetch(`/api/attendance/${attendanceId}`);
    const data = await res.json();
    if (data.success) {
      const record = data.attendance;
      document.getElementById('modal-title').textContent = 'Edit Attendance';
      document.getElementById('attendance-id').value = record.attendance_id;
      document.getElementById('attendance-subject').value = record.subject;
      document.getElementById('attendance-date').value = record.date.substring(0, 10);
      document.getElementById('attendance-status').value = record.status;
      
      attendanceModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load attendance details.', 'error');
    }
  } catch (error) {
    console.error('Error loading attendance details:', error);
    showToast('Failed to load attendance details.', 'error');
  }
}

function closeModal() {
  attendanceModal.classList.add('hidden');
}

// Handle Form Submission
attendanceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('attendance-id').value;
  const subject = document.getElementById('attendance-subject').value;
  const date = document.getElementById('attendance-date').value;
  const status = document.getElementById('attendance-status').value;

  const url = id ? `/api/attendance/${id}` : '/api/attendance';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, date, status })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Attendance updated successfully!' : 'Attendance added successfully!', 'success');
      closeModal();
      loadAttendance();
    } else {
      showToast(data.error || 'Failed to save attendance.', 'error');
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation Modals
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(attendanceId) {
  attendanceToDelete = attendanceId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  attendanceToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!attendanceToDelete) return;
  try {
    const res = await fetch(`/api/attendance/${attendanceToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Attendance record deleted successfully.', 'success');
      closeDeleteModal();
      loadAttendance();
    } else {
      showToast(data.error || 'Failed to delete attendance record.', 'error');
    }
  } catch (error) {
    console.error('Error deleting attendance:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Listeners
document.getElementById('btn-add-attendance').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Instant Filter/Search event hooks
document.getElementById('search-input').addEventListener('input', loadAttendance);
document.getElementById('sort-by').addEventListener('change', loadAttendance);

// Init call
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadAttendance();
});
