import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getDatabase, ref, push, get, update, remove } from 'firebase/database';

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

const uploadButton = document.getElementById('upload-button');
const userBtn = document.getElementById('user-btn');
const userText = document.getElementById('user-text');
let currentEditKey = null;

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function signInWithGoogle() {
    signInWithPopup(auth, provider)
        .then(() => {
            closeModal('login-modal');
            closeModal('signup-modal');
            loadFileList();
        })
        .catch(error => {
            const statusElement = document.getElementById('login-status') || document.getElementById('signup-status');
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const statusElement = document.getElementById('login-status');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Logging in...</div>';
    
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            closeModal('login-modal');
            loadFileList();
        })
        .catch(error => {
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function signup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const statusElement = document.getElementById('signup-status');
    
    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Creating account...</div>';
    
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            closeModal('signup-modal');
            loadFileList();
        })
        .catch(error => {
            statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">${error.message}</div>`;
        });
}

function logout() {
    signOut(auth).then(() => {
        document.getElementById('status').innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">Logged out successfully.</div>';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
    }).catch(error => {
        document.getElementById('status').innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">${error.message}</div>`;
    });
}

function generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

uploadButton.addEventListener('click', () => {
    if (!auth.currentUser) {
        openModal('login-modal');
        return;
    }

    const folderName = document.getElementById('folder-name').value.trim();
    const subFolderName = document.getElementById('sub-folder-name').value.trim();
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;

    if (files.length === 0) {
        document.getElementById('status').innerHTML = '<div class="text-red-500 p-3 bg-red-50 rounded">No files selected</div>';
        return;
    }

    if (!folderName) {
        document.getElementById('status').innerHTML = '<div class="text-red-500 p-3 bg-red-50 rounded">Institute name is required</div>';
        return;
    }

    let path = folderName;
    if (subFolderName) path += `/${subFolderName}`;

    const statusElement = document.getElementById('status');
    statusElement.innerHTML = '<div class="text-blue-600 p-3 bg-blue-50 rounded">Uploading...</div>';

    Array.from(files).forEach(file => {
        const pdfId = generateRandomId();
        const storageReference = storageRef(storage, `${path}/${file.name}`);
        const uploadTask = uploadBytes(storageReference, file);

        const progressContainer = document.createElement('div');
        progressContainer.className = 'w-full bg-gray-200 rounded h-5 mt-2 relative';
        const progressBar = document.createElement('div');
        progressBar.className = 'bg-blue-600 h-full rounded text-white text-xs leading-5 text-center';
        const progressText = document.createElement('div');
        progressText.className = 'absolute w-full text-center text-xs';
        progressContainer.appendChild(progressBar);
        progressContainer.appendChild(progressText);
        statusElement.appendChild(progressContainer);

        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        }, (error) => {
            progressText.innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">Error: ${error.message}</div>`;
            progressBar.className = 'bg-red-600 h-full rounded';
        }, () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                const fileData = {
                    name: file.name,
                    url: downloadURL,
                    date: new Date().toISOString(),
                    folder: folderName,
                    subfolder: subFolderName || '',
                    uid: auth.currentUser.uid,
                    pdfId: pdfId
                };

                push(ref(database, 'files'), fileData).then(() => {
                    statusElement.innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">Files uploaded successfully</div>';
                    fileInput.value = '';
                    document.getElementById('folder-name').value = '';
                    document.getElementById('sub-folder-name').value = '';
                    loadFileList();
                }).catch(error => {
                    statusElement.innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">Error saving file data: ${error.message}</div>`;
                });
            });
        });
    });
});

function loadFileList() {
    const fileListElement = document.getElementById('file-list');
    fileListElement.innerHTML = '<h2 class="text-lg font-medium mb-2"><i class="fas fa-list mr-1"></i> All Files</h2>';

    const folders = {};
    get(ref(database, 'files')).then((snapshot) => {
        if (!snapshot.exists()) {
            fileListElement.innerHTML += '<div class="text-gray-500 p-3">No files available</div>';
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const fileData = childSnapshot.val();
            const { folder, subfolder, name, pdfId, date } = fileData;
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            if (!folders[folder]) folders[folder] = {};
            if (subfolder) {
                if (!folders[folder][subfolder]) folders[folder][subfolder] = [];
                folders[folder][subfolder].push({ name, pdfId, date: formattedDate, key: childSnapshot.key });
            } else {
                if (!folders[folder]['_files']) folders[folder]['_files'] = [];
                folders[folder]['_files'].push({ name, pdfId, date: formattedDate, key: childSnapshot.key });
            }
        });

        Object.keys(folders).sort().forEach(folder => {
            const section = document.createElement('div');
            section.className = 'section mb-4';

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'px-4 py-2 border-b border-gray-200';
            sectionHeader.innerHTML = `<h3 class="text-md font-semibold text-gray-800">${folder}</h3>`;
            section.appendChild(sectionHeader);

            const sectionContent = document.createElement('div');
            sectionContent.className = 'px-4 py-2';

            if (folders[folder]['_files']) {
                folders[folder]['_files'].forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item flex justify-between items-center py-2 px-3 rounded-lg cursor-pointer mb-1';
                    fileItem.innerHTML = `
                        <div class="flex items-center">
                            <i class="fas fa-file-pdf text-red-500 mr-2 text-lg"></i>
                            <div>
                                <div class="font-medium text-gray-800">${file.name}</div>
                                <div class="text-xs text-gray-500">Added ${file.date}</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <a href="/view?pdfid=${file.pdfId}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-link"></i>
                            </a>
                            <button onclick="editFile('${file.key}', '${folder}', '')" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteFile('${file.key}', '${folder}/${file.name}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    sectionContent.appendChild(fileItem);
                });
            }

            Object.keys(folders[folder]).forEach(subfolder => {
                if (subfolder === '_files') return;

                const subfolderItem = document.createElement('div');
                subfolderItem.className = 'mb-2';

                const subfolderHeader = document.createElement('div');
                subfolderHeader.className = 'folder-toggle flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg cursor-pointer mb-1';
                subfolderHeader.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-folder text-yellow-500 mr-2 text-lg"></i>
                        <span class="font-medium text-gray-800">${subfolder}</span>
                    </div>
                    <i class="fas fa-chevron-right text-gray-500"></i>
                `;

                const subfolderContent = document.createElement('div');
                subfolderContent.className = 'pl-8 hidden';

                folders[folder][subfolder].forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item flex justify-between items-center py-2 px-3 rounded-lg cursor-pointer mb-1';
                    fileItem.innerHTML = `
                        <div class="flex items-center">
                            <i class="fas fa-file-pdf text-red-500 mr-2 text-lg"></i>
                            <div>
                                <div class="font-medium text-gray-800">${file.name}</div>
                                <div class="text-xs text-gray-500">Added ${file.date}</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <a href="/view?pdfid=${file.pdfId}" target="_blank" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-link"></i>
                            </a>
                            <button onclick="editFile('${file.key}', '${folder}', '${subfolder}')" class="text-green-600 hover:text-green-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteFile('${file.key}', '${folder}/${subfolder}/${file.name}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
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
            fileListElement.appendChild(section);
        });

        document.getElementById('search-input').addEventListener('input', function() {
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
    }).catch((error) => {
        document.getElementById('status').innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">Error loading file list: ${error.message}</div>`;
    });
}

function editFile(key, folder, subfolder) {
    currentEditKey = key;
    document.getElementById('edit-folder').value = folder;
    document.getElementById('edit-subfolder').value = subfolder;
    openModal('edit-modal');
}

function saveEdit() {
    const newFolder = document.getElementById('edit-folder').value.trim();
    const newSubfolder = document.getElementById('edit-subfolder').value.trim();
    const statusElement = document.getElementById('edit-status');

    if (!newFolder) {
        statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">Institute name is required</div>`;
        return;
    }

    statusElement.innerHTML = '<div class="text-blue-500 p-2 bg-blue-50 rounded">Saving...</div>';

    update(ref(database, `files/${currentEditKey}`), {
        folder: newFolder,
        subfolder: newSubfolder
    }).then(() => {
        closeModal('edit-modal');
        document.getElementById('status').innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">File updated successfully</div>';
        setTimeout(() => document.getElementById('status').innerHTML = '', 3000);
        loadFileList();
    }).catch(error => {
        statusElement.innerHTML = `<div class="text-red-500 p-2 rounded bg-red-50">Error updating file: ${error.message}</div>`;
    });
}

function deleteFile(key, storagePath) {
    if (!confirm('Are you sure you want to delete this file?')) return;

    const statusElement = document.getElementById('status');
    statusElement.innerHTML = '<div class="text-blue-500 p-3 bg-blue-50 rounded">Deleting...</div>';

    deleteObject(storageRef(storage, storagePath)).then(() => {
        remove(ref(database, `files/${key}`)).then(() => {
            statusElement.innerHTML = '<div class="text-green-500 p-3 bg-green-50 rounded">File deleted successfully</div>';
            setTimeout(() => statusElement.innerHTML = '', 3000);
            loadFileList();
        }).catch(error => {
            statusElement.innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">Error deleting file: ${error.message}</div>`;
        });
    }).catch((error) => {
        statusElement.innerHTML = `<div class="text-red-500 p-3 bg-red-50 rounded">Error deleting file from storage: ${error.message}</div>`;
    });
}

auth.onAuthStateChanged(user => {
    if (user) {
        userText.textContent = 'Logout';
        userBtn.onclick = logout;
        userBtn.className = userBtn.className.replace('bg-blue-600', 'bg-gray-600');
        uploadButton.disabled = false;
        loadFileList();
    } else {
        userText.textContent = 'Login';
        userBtn.onclick = () => openModal('login-modal');
        userBtn.className = userBtn.className.replace('bg-gray-600', 'bg-blue-600');
        uploadButton.disabled = true;
        openModal('login-modal');
    }
});

userBtn.addEventListener('click', function(e) {
    if (auth.currentUser) return;
    openModal('login-modal');
});
