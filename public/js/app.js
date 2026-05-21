const API_URL = '/api';

// State
let tasks = [];
let token = localStorage.getItem('token');
let isAdmin = !!token;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfile = document.getElementById('userProfile');
const adminControls = document.getElementById('adminControls');
const addTaskBtn = document.getElementById('addTaskBtn');

const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskModalTitle = document.getElementById('taskModalTitle');
const taskIdInput = document.getElementById('taskId');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescInput = document.getElementById('taskDesc');
const taskStatusInput = document.getElementById('taskStatus');
const taskPriorityInput = document.getElementById('taskPriority');
const taskDowntimeInput = document.getElementById('taskDowntime');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

// Initialize
function init() {
    setupEventListeners();
    updateAuthUI();
    fetchTasks();
}

function setupEventListeners() {
    // Modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    document.querySelectorAll('.modal-backdrop').forEach(bd => {
        bd.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    // Auth
    loginBtn.addEventListener('click', () => {
        loginModal.classList.remove('hidden');
        document.getElementById('username').focus();
    });

    logoutBtn.addEventListener('click', () => {
        token = null;
        isAdmin = false;
        localStorage.removeItem('token');
        updateAuthUI();
        renderTasks(); // Re-render to hide admin controls
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                token = data.token;
                isAdmin = true;
                localStorage.setItem('token', token);
                loginModal.classList.add('hidden');
                loginForm.reset();
                loginError.textContent = '';
                updateAuthUI();
                renderTasks();
            } else {
                loginError.textContent = data.error || 'Authentication error';
            }
        } catch (err) {
            loginError.textContent = 'Network error';
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Task Actions
    addTaskBtn.addEventListener('click', () => {
        openTaskModal();
    });

    cancelTaskBtn.addEventListener('click', () => {
        taskModal.classList.add('hidden');
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = taskIdInput.value;
        const payload = {
            title: taskTitleInput.value,
            description: taskDescInput.value,
            status: taskStatusInput.value,
            priority: taskPriorityInput.value,
            downtime: taskDowntimeInput.checked ? 1 : 0
        };

        const submitBtn = taskForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const url = id ? `${API_URL}/tasks/${id}` : `${API_URL}/tasks`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                taskModal.classList.add('hidden');
                fetchTasks();
            } else {
                if (res.status === 401 || res.status === 403) handleAuthError();
                else alert('Error saving task');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Drag and Drop
    const columns = document.querySelectorAll('.task-list');
    columns.forEach(col => {
        col.addEventListener('dragover', e => {
            if (!isAdmin) return;
            e.preventDefault();
            col.classList.add('drag-over');
        });
        
        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });
        
        col.addEventListener('drop', e => {
            if (!isAdmin) return;
            e.preventDefault();
            col.classList.remove('drag-over');
            
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard) {
                const taskId = draggingCard.dataset.id;
                const newStatus = col.dataset.status;
                
                const task = tasks.find(t => t.id == taskId);
                if (task && task.status !== newStatus) {
                    changeTaskStatus(taskId, newStatus);
                }
            }
        });
    });
}

function updateAuthUI() {
    if (isAdmin) {
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        adminControls.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        adminControls.classList.add('hidden');
    }
}

function handleAuthError() {
    token = null;
    isAdmin = false;
    localStorage.removeItem('token');
    updateAuthUI();
    renderTasks();
    loginModal.classList.remove('hidden');
    loginError.textContent = 'Session expired. Please log in again.';
}

async function fetchTasks() {
    try {
        const res = await fetch(`${API_URL}/tasks`);
        const data = await res.json();
        if (res.ok) {
            tasks = data.tasks;
            renderTasks();
        }
    } catch (err) {
        console.error('Failed to fetch tasks', err);
    }
}

function renderTasks() {
    const columns = {
        'planned': document.querySelector('#col-planned .task-list'),
        'in-progress': document.querySelector('#col-in-progress .task-list'),
        'done': document.querySelector('#col-done .task-list')
    };

    // Clear columns
    Object.values(columns).forEach(col => col.innerHTML = '');

    // Reset counts
    const counts = { 'planned': 0, 'in-progress': 0, 'done': 0 };

    tasks.forEach(task => {
        if (columns[task.status]) {
            counts[task.status]++;
            const card = createTaskCard(task);
            columns[task.status].appendChild(card);
        }
    });

    // Update counts
    document.querySelector('#col-planned .count').textContent = counts['planned'];
    document.querySelector('#col-in-progress .count').textContent = counts['in-progress'];
    document.querySelector('#col-done .count').textContent = counts['done'];
}

function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    
    if (isAdmin) {
        div.draggable = true;
        div.dataset.id = task.id;
        div.addEventListener('dragstart', () => div.classList.add('dragging'));
        div.addEventListener('dragend', () => div.classList.remove('dragging'));
    }
    
    const date = new Date(task.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let actionsHtml = '';
    if (isAdmin) {
        actionsHtml = `
            <div class="task-actions">
                <button class="btn-icon" onclick="editTask(${task.id})" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-icon" onclick="deleteTask(${task.id})" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
    }

    let badges = '';
    if (task.priority === 'high') {
        badges += `<span class="priority-badge high">High Priority</span>`;
    }
    if (task.downtime) {
        badges += `<span class="priority-badge downtime">Downtime</span>`;
    }

    div.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            ${actionsHtml}
        </div>
        ${badges ? `<div class="badges-container">${badges}</div>` : ''}
        ${task.description ? `<div class="task-desc">${escapeHtml(task.description).replace(/\\n/g, '<br>')}</div>` : ''}
        <div class="task-footer">
            <span>#${task.id} • ${date}</span>
        </div>
    `;

    return div;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Global actions exposed to inline handlers
window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        openTaskModal(task);
    }
};

window.deleteTask = async function(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            const res = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchTasks();
            else if (res.status === 401 || res.status === 403) handleAuthError();
        } catch (err) {
            alert('Network error');
        }
    }
};

window.changeTaskStatus = async function(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchTasks();
        else if (res.status === 401 || res.status === 403) handleAuthError();
    } catch (err) {
        alert('Network error');
    }
};

function openTaskModal(task = null) {
    taskForm.reset();
    if (task) {
        taskModalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescInput.value = task.description || '';
        taskStatusInput.value = task.status;
        taskPriorityInput.value = task.priority || 'low';
        taskDowntimeInput.checked = !!task.downtime;
    } else {
        taskModalTitle.textContent = 'New Task';
        taskIdInput.value = '';
        taskStatusInput.value = 'planned';
        taskPriorityInput.value = 'low';
        taskDowntimeInput.checked = false;
    }
    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
}

// Start
init();
