const firebaseConfig = {
    apiKey: "AIzaSyAolcB_o6f1CQPbLSYrMKTYaz_xYs54khY",
    authDomain: "quizapp-1ae20.firebaseapp.com",
    databaseURL: "https://quizapp-1ae20-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quizapp-1ae20",
    storageBucket: "quizapp-1ae20.appspot.com",
    messagingSenderId: "626886802317",
    appId: "1:626886802317:web:df08c307697ca235c45bc4",
    measurementId: "G-NKJTC5C1XW"
};

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
    document.getElementById(modalId).classList.add('hidden');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function signInWithGoogle() {
    auth.signInWithPopup(provider)
        .then(() => {
            closeModal('loginModal');
            closeModal('signupModal');
            displayFiles();
        })
        .catch(error => {
            const statusElement = document.getElementById('loginStatus') || document.getElementById('signupStatus');
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const statusElement = document.getElementById('loginStatus');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Logging in...</div>';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            closeModal('loginModal');
            displayFiles();
        })
        .catch(error => {
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const statusElement = document.getElementById('signupStatus');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Creating account...</div>';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            closeModal('signupModal');
            displayFiles();
        })
        .catch(error => {
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function logout() {
    auth.signOut().then(() => {
        showLogin();
        document.getElementById('status').innerHTML = '<div class="text-green-600 p-3 bg-green-50 rounded">Logged out successfully.</div>';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
    }).catch(error => {
        document.getElementById('status').innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">${error.message}</div>`;
    });
}

function showLogin() {
    fileList.classList.add('hidden');
    loading.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.remove('hidden');
    userText.textContent = 'Login';
}

function displayFiles() {
    fileList.classList.add('hidden');
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    fileList.innerHTML = '';

    database.ref('files').once('value').then(snapshot => {
        if (!snapshot.exists()) {
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
        loading.classList.add('hidden');
        document.getElementById('status').innerHTML = `
            <div class="text-red-500 p-3 bg-red-50 rounded">
                Error loading files: ${error.message}
            </div>
        `;
    });
}

// Initialize auth state listener
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        userText.textContent = 'Logout';
        userBtn.onclick = logout;
        userBtn.className = userBtn.className.replace('bg-blue-600', 'bg-gray-600');
        displayFiles();
    } else {
        showLoginRequired();
        userText.textContent = 'Login';
        userBtn.onclick = () => openModal('loginModal');
        userBtn.className = userBtn.className.replace('bg-gray-600', 'bg-blue-600');
    }
});

// Open login modal if not authenticated when clicking user button
userBtn.addEventListener('click', function(e) {
    if (auth.currentUser) return;
    openModal('loginModal');
});
