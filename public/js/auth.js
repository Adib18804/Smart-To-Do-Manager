// Client-Side Authentication & Session Helper

// Base function to trigger Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) {
    const newContainer = document.createElement('div');
    newContainer.id = 'toast-container';
    document.body.appendChild(newContainer);
  }
  
  const toast = document.createElement('div');
  // Styling according to toast type
  let bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-l-4 border-indigo-500';
  let icon = `
    <svg class="w-5 h-5 text-indigo-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  `;

  if (type === 'success') {
    bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-l-4 border-emerald-500';
    icon = `
      <svg class="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
    `;
  } else if (type === 'error') {
    bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-l-4 border-rose-500';
    icon = `
      <svg class="w-5 h-5 text-rose-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    `;
  } else if (type === 'warning') {
    bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-l-4 border-amber-500';
    icon = `
      <svg class="w-5 h-5 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    `;
  }

  toast.className = `toast glass-card flex items-center p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 ${bgClass}`;
  toast.innerHTML = `
    <div class="flex items-center w-full">
      ${icon}
      <div class="text-sm font-medium pr-4">${message}</div>
      <button class="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  `;
  
  document.getElementById('toast-container').appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Check Profile / Session state
async function checkAuthSession() {
  try {
    const res = await fetch('/api/auth/profile');
    if (res.status === 401) {
      // If we are on public pages like login/register, do nothing. Else redirect.
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
      return null;
    }
    const data = await res.json();
    if (data.success) {
      // Update sidebar username if container exists
      const nameElements = document.querySelectorAll('.user-display-name');
      nameElements.forEach(el => el.textContent = data.user.name);
      
      const emailElements = document.querySelectorAll('.user-display-email');
      emailElements.forEach(el => el.textContent = data.user.email);
      
      return data.user;
    }
  } catch (error) {
    console.error('Session validation error:', error);
  }
  return null;
}

// Log out operation
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } else {
      showToast(data.error || 'Failed to logout.', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Failed to connect to server.', 'error');
  }
}

// Toggle Theme (Light/Dark Mode)
function setupThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;
  
  // Set initial icon / state
  const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  // Setup Dark mode instantly
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  setupThemeToggle();
  checkAuthSession();
  
  // Bind Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});
