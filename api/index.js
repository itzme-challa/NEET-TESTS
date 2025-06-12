const firebaseConfig = window.firebaseConfig; // Loaded from HTML script tag

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// UI Elements
const content = document.getElementById('content');
const fileList = document.getElementById('fileList');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const loginRequired = document.getElementById('loginRequired');
const userBtn = document.getElementById('userBtn');
const userText = document.getElementById('userText');

function closeModal(modalId) {
    console.log(`Closing modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function openModal(modalId) {
    console.log(`Opening modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        console.error(`Modal with ID ${modalId} not found`);
    }
}

function signInWithGoogle() {
    console.log('Initiating Google sign-in');
    auth.signInWithPopup(provider)
        .then(() => {
            console.log('Google sign-in successful');
            closeModal('loginModal');
            closeModal('signupModal');
            displayFiles();
        })
        .catch(error => {
            console.error('Google sign-in error:', error);
            const statusElement = document.getElementById('loginStatus') || document.getElementById('signupStatus');
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function login() {
    console.log('Initiating email login');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const statusElement = document.getElementById('loginStatus');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Logging in...</div>';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Email login successful');
            closeModal('loginModal');
            displayFiles();
        })
        .catch(error => {
            console.error('Email login error:', error);
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function signup() {
    console.log('Initiating signup');
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const statusElement = document.getElementById('signupStatus');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Creating account...</div>';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            console.log('Signup successful');
            closeModal('signupModal');
            displayFiles();
        })
        .catch(error => {
            console.error('Signup error:', error);
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function logout() {
    console.log('Initiating logout');
    auth.signOut().then(() => {
        console.log('Logout successful');
        showLoginRequired();
        document.getElementById('status').innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">Logged out successfully.</div>';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
    }).catch(error => {
        console.error('Logout error:', error);
        document.getElementById('status').innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">${error.message}</div>`;
    });
}

function showLoginRequired() {
    console.log('Showing login required state');
    fileList.classList.add('hidden');
    loading.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.remove('hidden');
    userText.textContent = 'Login';
}

function displayFiles() {
    console.log('Displaying files');
    fileList.classList.add('hidden');
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    fileList.innerHTML = '';

    database.ref('files').once('value').then(snapshot => {
        if (!snapshot.exists()) {
            console.log('No files found');
            loading.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        const folders = {};
        snapshot.forEach(childSnapshot => {
            const fileData = childSnapshot.val();
            const { folder, subfolder, name, pdfId, date } = fileData;
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            if (!folders[folder]) folders[folder] = {};
            if (subfolder) {
                if (!folders[folder][subfolder]) folders[folder][subfolder] = [];
                folders[folder][subfolder].push({ name, pdfId, date: formattedDate });
            } else {
                if (!folders[folder]['_files']) folders[folder]['_files'] = [];
                folders[folder]['_files'].push({ name, pdfId, date: formattedDate });
            }
        });

        Object.keys(folders).sort().forEach(folder => {
            const section = document.createElement('div');
            section.className = 'section';
            
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header px-6 py-3 border-b border-gray-200';
            sectionHeader.innerHTML = `
                <h2 class="text-lg font-semibold text-gray-800">${folder}</h2>
            `;
            section.appendChild(sectionHeader);
            
            const sectionContent = document.createElement('div');
            sectionContent.className = 'px-6 py-4';
            
            if (folders[folder]['_files']) {
                folders[folder]['_files'].forEach(file => {
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
                        <a href="/view?pdfid=${file.pdfId}" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    `;
                    sectionContent.appendChild(fileItem);
                });
            }
            
            Object.keys(folders[folder]).forEach(subfolder => {
                if (subfolder === '_files') return;
                
                const subfolderItem = document.createElement('div');
                subfolderItem.className = 'mb-4';
                
                const subfolderHeader = document.createElement('div');
                subfolderHeader.className = 'folder-toggle flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg cursor-pointer mb-2';
                subfolderHeader.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-folder text-yellow-500 mr-3 text-lg"></i>
                        <span class="font-medium text-gray-800">${subfolder}</span>
                    </div>
                    <i class="fas fa-chevron-right text-gray-500"></i>
                `;
                
                const subfolderContent = document.createElement('div');
                subfolderContent.className = 'pl-10 hidden';
                
                folders[folder][subfolder].forEach(file => {
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
                        <a href="/view?pdfid=${file.pdfId}" class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    `;
                    subfolderContent.appendChild(fileItem);
                });
                
                subfolderHeader.addEventListener('click', () => {
                    subfolderHeader.classList.toggle('expanded');
                    subfolderContent.classList.toggle('hidden');
                });
                
                subfolderItem.appendChild(subfolderHeader);
                subfolderItem.appendChild(subfolderContent);
                sectionContent.appendChild(subfolderItem);
            });
            
            section.appendChild(sectionContent);
            fileList.appendChild(section);
        });

        loading.classList.add('hidden');
        fileList.classList.remove('hidden');
        
        document.getElementById('searchInput').addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const sections = document.querySelectorAll('.section');
            
            sections.forEach(section => {
                let hasVisibleItems = false;
                const fileItems = section.querySelectorAll('.file-item');
                
                fileItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(query)) {
                        item.classList.remove('hidden');
                        hasVisibleItems = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });
                
                section.style.display = hasVisibleItems ? 'block' : 'none';
            });
        });
        
    }).catch(error => {
        console.error('Error loading files:', error);
        loading.classList.add('hidden');
        document.getElementById('status').innerHTML = `
            <div class="text-red-500 p-3 bg-red-50 rounded">
                Error loading files: ${error.message}
            </div>`;
    });
}

// Initialize auth state listener
auth.onAuthStateChanged(user => {
    console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
    if (user) {
        userText.textContent = 'Logout';
        userBtn.onclick = logout;
        userBtn.className = userBtn.className.replace('bg-blue-600', 'bg-gray-600');
        displayFiles();
    } else {
        showLoginRequired();
        userText.textContent = 'Login';
        userBtn.onclick = () => {
            console.log('Login button clicked');
            openModal('loginModal');
        };
        userBtn.className = userBtn.className.replace('bg-gray-600', 'bg-blue-600');
    }
});

// Ensure userBtn click works
if (userBtn) {
    userBtn.addEventListener('click', () => {
        console.log('User button clicked');
        if (!auth.currentUser) {
            openModal('loginModal');
        }
    });
} else {
    console.error('userBtn element not found');
}
