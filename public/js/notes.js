// Notes Page Management Client Script

let noteToDelete = null;

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

// Fetch and render notes with filter queries
async function loadNotes() {
  try {
    const search = document.getElementById('search-input').value;
    const sortBy = document.getElementById('sort-by').value;

    const queryParams = new URLSearchParams({
      search,
      sortBy
    });

    const res = await fetch(`/api/notes?${queryParams.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return;
      throw new Error('Failed to fetch notes.');
    }

    const data = await res.json();
    if (data.success) {
      renderNotes(data.notes);
    }
  } catch (error) {
    console.error('Error loading notes:', error);
    showToast('Failed to load notes.', 'error');
  }
}

// Render note cards
function renderNotes(notes) {
  const container = document.getElementById('notes-list');
  const emptyState = document.getElementById('notes-empty-state');
  if (!container) return;

  if (!notes || notes.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = notes.map(note => {
    // Format date
    const date = new Date(note.created_at);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="glass-card p-6 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/50 flex flex-col justify-between transition-all">
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 w-[78%]">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">${note.title}</h4>
            </div>
            
            <!-- Card actions -->
            <div class="flex items-center gap-1.5">
              <button onclick="openEditModal(${note.note_id})" class="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onclick="confirmDelete(${note.note_id})" class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">${note.content || '<i>No content.</i>'}</p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/30">
          <div class="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span>${formattedDate}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Modal handling logic
const noteModal = document.getElementById('note-modal');
const noteForm = document.getElementById('note-form');

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Note';
  document.getElementById('note-id').value = '';
  noteForm.reset();
  
  noteModal.classList.remove('hidden');
}

async function openEditModal(noteId) {
  try {
    const res = await fetch(`/api/notes/${noteId}`);
    const data = await res.json();
    if (data.success) {
      const note = data.note;
      document.getElementById('modal-title').textContent = 'Edit Note';
      document.getElementById('note-id').value = note.note_id;
      document.getElementById('note-title').value = note.title;
      document.getElementById('note-content').value = note.content || '';
      
      noteModal.classList.remove('hidden');
    } else {
      showToast(data.error || 'Failed to load note details.', 'error');
    }
  } catch (error) {
    console.error('Error loading note details:', error);
    showToast('Failed to load note details.', 'error');
  }
}

function closeModal() {
  noteModal.classList.add('hidden');
}

// Handle Form Submission
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('note-id').value;
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;

  const url = id ? `/api/notes/${id}` : '/api/notes';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Note updated successfully!' : 'Note added successfully!', 'success');
      closeModal();
      loadNotes();
    } else {
      showToast(data.error || 'Failed to save note.', 'error');
    }
  } catch (error) {
    console.error('Error saving note:', error);
    showToast('Failed to connect to server.', 'error');
  }
});

// Delete Confirmation Modals
const deleteModal = document.getElementById('delete-modal');

function confirmDelete(noteId) {
  noteToDelete = noteId;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  noteToDelete = null;
}

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!noteToDelete) return;
  try {
    const res = await fetch(`/api/notes/${noteToDelete}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Note deleted successfully.', 'success');
      closeDeleteModal();
      loadNotes();
    } else {
      showToast(data.error || 'Failed to delete note.', 'error');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    showToast('Connection error.', 'error');
  }
});

// Bind Event Listeners
document.getElementById('btn-add-note').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);

// Instant Filter/Search event hooks
document.getElementById('search-input').addEventListener('input', loadNotes);
document.getElementById('sort-by').addEventListener('change', loadNotes);

// Init call
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  loadNotes();
});
