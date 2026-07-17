// Users Page Management Client Script

let userToDelete = null;

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

// Fetch and render users
async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch users.');
    }

    const data = await res.json();
    if (data.success) {
      renderUsers(data.users);
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('Failed to load users.', 'error');
  }
}

// Render user cards
function renderUsers(users) {
  const container = document.getElementById('users-list');
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
        No users found.
      </div>
    `;
    return;
  }

  container.innerHTML = users.map(user => {
    // Role badge styles
    let roleClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300';
    if (user.role === 'Super Admin') {
      roleClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
    }

    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between transition-all">
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 w-[78%]">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-base shadow-inner">
                ${user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">${user.name}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400">${user.email}</p>
              </div>
            </div>
            
            <!-- Card actions -->
            <div class="flex items-center gap-1.5">
              <button onclick="openEditModal(${user.user_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${user.user_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all" ${user.user_id === currentUserId ? 'disabled' : ''}>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <!-- Role -->
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${roleClass}">${user.role}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Modal handling logic
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add User';
  document.getElementById('user-id').value = '';
  userForm.reset();
  
  userModal.classList.remove('hidden');
}

async function openEditModal(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    if (data.success) {
      const user = data.user;
      document.getElementById('modal-title').textContent = 'Edit User';
      document.getElementById('user-id').value = user.user_id;
      document.getElementById('user-name').value = user.name;
      document.getElementById('user-email').value = user.email;
      document.getElementById('user-password').value = '';
      document.getElementById('user-role').value = user.role;
      
      userModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load user details.', 'error');
    }
  } catch (error) {
    console.error('Error loading user details:', error);
    showToast('Failed to load user details.', 'error');
  }
}

function closeModal() {
  userModal.classList.add('hidden');
}

// Handle Form Submission
userForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('user-id').value;
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;

  const url = id ? `/api/users/${id}` : '/api/users';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'User updated successfully!' : 'User added successfully!', 'success');
      closeModal();
      loadUsers();
    } else {
      showToast(data.error || 'Failed to save user.', 'error');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation Modals
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(userId) {
  userToDelete = userId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  userToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!userToDelete) return;
  try {
    const res = await fetch(`/api/users/${userToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('User deleted successfully.', 'success');
      closeDeleteModal();
      loadUsers();
    } else {
      showToast(data.error || 'Failed to delete user.', 'error');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Listeners
document.getElementById('btn-add-user').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Current user ID to prevent deleting self
let currentUserId = null;

// Init call
document.addEventListener('DOMContentLoaded', async () => {
  setupMobileSidebar();
  
  // Get current user
  try {
    const res = await fetch('/api/auth/profile');
    const data = await res.json();
    if (data.success) {
      currentUserId = data.user.user_id;
    }
  } catch (error) {
    console.error('Error loading current user:', error);
  }
  
  loadUsers();
});
