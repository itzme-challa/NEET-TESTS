import { auth, database, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '/src/firebase.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

// UI Elements
const content = document.getElementById('content');
const fileList = document.getElementById('fileList');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const loginRequired = document.getElementById('loginRequired');
const userBtn = document.getElementById('userBtn');
const userText = document.getElementById('userText');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('searchInput');

let folderData = {}; // Cache folder structure
let currentPath = []; // Track current navigation path

window.openModal = function(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
};

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.add('hidden');
};

window.signInWithGoogle = async function() {
    try {
        await signInWithPopup(auth, provider);
        closeModal('loginModal');
        closeModal('signupModal');
        await loadFiles();
    } catch (error) {
        const statusElement = document.getElementById('loginStatus') || document.getElementById('signupStatus');
        statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
    }
};

window.login = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const statusElement = document.getElementById('loginStatus');
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Logging in...</div>';
    try {
        await signInWithEmailAndPassword(auth, email, password);
        closeModal('loginModal');
        await loadFiles();
    } catch (error) {
        statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
    }
};

window.signup = async function() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const statusElement = document.getElementById('signupStatus');
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Creating account...</div>';
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        closeModal('signupModal');
        await loadFiles();
    } catch (error) {
        statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
    }
};

async function logout() {
    try {
        await signOut(auth);
        showLoginRequired();
        document.getElementById('status').innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">Logged out successfully.</div>';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
    } catch (error) {
        document.getElementById('status').innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">${error.message}</div>`;
    }
}

function showLoginRequired() {
    fileList.classList.add('hidden');
    loading.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.remove('hidden');
    breadcrumb.classList.add('hidden');
    userText.textContent = 'Login';
}

function renderBreadcrumbs() {
    breadcrumb.innerHTML = '';
    const nav = document.createElement('span');
    nav.className = 'text-gray-600 text-sm flex items-center flex-wrap gap-1';
    const rootLink = document.createElement('a');
    rootLink.href = '#';
    rootLink.className = 'text-blue-600 hover:underline breadcrumb-item';
    rootLink.textContent = 'Home';
    rootLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo([]);
    });
    nav.appendChild(rootLink);

    currentPath.forEach((folder, index) => {
        nav.appendChild(document.createTextNode(' > '));
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'text-blue-600 hover:underline breadcrumb-item';
        link.textContent = folder;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(currentPath.slice(0, index + 1));
        });
        nav.appendChild(link);
    });

    breadcrumb.appendChild(nav);
    breadcrumb.classList.remove('hidden');
}

function navigateTo(path) {
    currentPath = path;
    const pathStr = path.map(encodeURIComponent).join('/');
    window.history.pushState({ path }, '', `#${pathStr}`);
    displayCurrentPath();
    renderBreadcrumbs();
}

function displayCurrentPath() {
    fileList.classList.add('hidden');
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    fileList.innerHTML = '';

    let current = folderData;
    currentPath.forEach(folder => {
        current = current[folder] || {};
    });

    if (Object.keys(current).length === 0) {
        loading.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    const section = document.createElement('div');
    section.className = 'section px-4 py-2';

    // Subfolders
    Object.keys(current).forEach(key => {
        if (key === '_files') return;
        const subfolderItem = document.createElement('div');
        subfolderItem.className = 'folder-toggle flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg cursor-pointer mb-2';
        subfolderItem.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-folder text-yellow-500 mr-3 text-lg"></i>
                <span class="font-medium text-gray-800">${key}</span>
            </div>
            <i class="fas fa-chevron-right text-gray-500"></i>
        `;
        subfolderItem.addEventListener('click', () => {
            navigateTo([...currentPath, key]);
        });
        section.appendChild(subfolderItem);
    });

    // Files
    if (current['_files']) {
        current['_files'].forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item flex justify-between items-center py-3 px-4 rounded-lg cursor-pointer mb-2';
            fileItem.innerHTML = `
                <div class="flex items-center">
                    <i class="fas fa-file-pdf text-red-500 mr-3 text-lg"></i>
                    <div>
                        <div class="font-medium text-gray-800">${file.name}</div>
                        <div class="text-xs text-gray-500">Added ${file.date}</div>
                    </div>
                </div>
                <a href="/view?pdfid=${file.id}" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded">
                    <i class="fas fa-eye"></i>
                </a>
            `;
            section.appendChild(fileItem);
        });
    }

    fileList.appendChild(section);
    loading.classList.add('hidden');
    fileList.classList.remove('hidden');

    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const items = section.querySelectorAll('.file-item, .folder-toggle');
        let hasVisibleItems = false;
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.classList.remove('hidden');
                hasVisibleItems = true;
            } else {
                item.classList.add('hidden');
            }
        });
        section.style.display = hasVisibleItems || query === '' ? 'block' : 'none';
    });
}

async function loadFiles() {
    fileList.classList.add('hidden');
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    folderData = {};

    try {
        const filesRef = ref(database, 'files');
        const snapshot = await get(filesRef);

        if (!snapshot.exists()) {
            loading.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        const data = snapshot.val();
        folderData = {};

        Object.entries(data).forEach(([id, fileData]) => {
            const { folder, subfolder, name, date } = fileData;
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            if (!folderData[folder]) folderData[folder] = {};
            if (subfolder) {
                const subfolderPath = subfolder.split('/');
                let current = folderData[folder];
                subfolderPath.forEach((sf, index) => {
                    if (!current[sf]) current[sf] = {};
                    if (index === subfolderPath.length - 1) {
                        if (!current[sf]['_files']) current[sf]['_files'] = [];
                        current[sf]['_files'].push({ name, id, date: formattedDate });
                    }
                    current = current[sf];
                });
            } else {
                if (!folderData[folder]['_files']) folderData[folder]['_files'] = [];
                folderData[folder]['_files'].push({ name, id, date: formattedDate });
            }
        });

        const hash = window.location.hash.replace('#', '').split('/').filter(Boolean);
        const decodedHash = hash.map(decodeURIComponent);
        navigateTo(decodedHash);
    } catch (error) {
        loading.classList.add('hidden');
        document.getElementById('status').innerHTML = `
            <div class="text-red-600 p-3 bg-red-50 rounded">Error loading files: ${error.message}</div>
        `;
    }
}

// Handle back/forward navigation
window.addEventListener('popstate', (event) => {
    const path = event.state ? event.state.path : [];
    currentPath = path;
    displayCurrentPath();
    renderBreadcrumbs();
});

// Initialize auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        userText.textContent = 'Logout';
        userBtn.onclick = logout;
        userBtn.className = userBtn.className.replace('bg-blue-600', 'bg-gray-600');
        loadFiles();
    } else {
        showLoginRequired();
        userText.textContent = 'Login';
        userBtn.onclick = () => openModal('loginModal');
        userBtn.className = userBtn.className.replace('bg-gray-600', 'bg-blue-600');
    }
});

// Open login modal if not authenticated
userBtn.addEventListener('click', function(e) {
    if (auth.currentUser) return;
    openModal('loginModal');
});
