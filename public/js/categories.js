// Categories Page Management Client Script

let categoryToDelete = null;

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

// Fetch and render categories
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch categories.');
    }

    const data = await res.json();
    if (data.success) {
      renderCategories(data.categories);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    showToast('Failed to load categories.', 'error');
  }
}

// Render category cards
function renderCategories(categories) {
  const container = document.getElementById('categories-list');
  const emptyState = document.getElementById('categories-empty-state');
  if (!container) return;

  if (!categories || categories.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = categories.map(category => {
    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between transition-all">
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 w-[78%]">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">${category.name}</h4>
            </div>
            
            <!-- Card actions -->
            <div class="flex items-center gap-1.5">
              <button onclick="openEditModal(${category.category_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${category.category_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <!-- Color -->
          ${category.color ? `
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full" style="background-color: ${category.color};"></div>
              <span class="text-xs text-slate-500 dark:text-slate-400">${category.color}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Modal handling logic
const categoryModal = document.getElementById('category-modal');
const categoryForm = document.getElementById('category-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Category';
  document.getElementById('category-id').value = '';
  categoryForm.reset();
  
  categoryModal.classList.remove('hidden');
}

async function openEditModal(categoryId) {
  try {
    const res = await fetch(`/api/categories/${categoryId}`);
    const data = await res.json();
    if (data.success) {
      const category = data.category;
      document.getElementById('modal-title').textContent = 'Edit Category';
      document.getElementById('category-id').value = category.category_id;
      document.getElementById('category-name').value = category.name;
      document.getElementById('category-color').value = category.color || '';
      
      categoryModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load category details.', 'error');
    }
  } catch (error) {
    console.error('Error loading category details:', error);
    showToast('Failed to load category details.', 'error');
  }
}

function closeModal() {
  categoryModal.classList.add('hidden');
}

// Handle Form Submission
categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('category-id').value;
  const name = document.getElementById('category-name').value;
  const color = document.getElementById('category-color').value;

  const url = id ? `/api/categories/${id}` : '/api/categories';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Category updated successfully!' : 'Category added successfully!', 'success');
      closeModal();
      loadCategories();
    } else {
      showToast(data.error || 'Failed to save category.', 'error');
    }
  } catch (error) {
    console.error('Error saving category:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation Modals
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(categoryId) {
  categoryToDelete = categoryId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  categoryToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!categoryToDelete) return;
  try {
    const res = await fetch(`/api/categories/${categoryToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Category deleted successfully.', 'success');
      closeDeleteModal();
      loadCategories();
    } else {
      showToast(data.error || 'Failed to delete category.', 'error');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Listeners
document.getElementById('btn-add-category').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Init call
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadCategories();
});
