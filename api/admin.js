const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin File Upload</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto max-w-6xl py-4 px-2">
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-md p-4 mb-4">
            <div class="header-container">
                <div class="title-container">
                    <i class="fas fa-upload text-blue-600 text-xl mr-2"></i>
                    <h1 class="text-xl font-bold text-gray-800">Admin File Upload</h1>
                </div>
                <div class="flex items-center gap-2">
                    <div class="search-container">
                        <input type="text" id="search-input" placeholder="Search files..." 
                               class="w-full px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <button id="user-btn" class="bg-blue-600 text-white px-3 py-1 rounded-lg flex items-center justify-center auth-btn">
                        <i class="fas fa-user mr-1"></i> <span id="user-text">Login</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="bg-white rounded-xl shadow-md p-8">
            <div class="mb-4">
                <label for="folder-name" class="block text-sm font-medium text-gray-700">
                    <i class="fas fa-folder mr-1"></i> Institute Name:
                </label>
                <input type="text" id="folder-name" placeholder="Enter institute name..." 
                       class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            </div>
            <div class="mb-4">
                <label for="sub-folder-name" class="block text-sm font-medium text-gray-700">
                    <i class="fas fa-folder-plus mr-1"></i> Test Name (optional):
                </label>
                <input type="text" id="sub-folder-name" placeholder="Enter test name..." 
                       class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            </div>
            <div class="mb-4">
                <label for="file-input" class="block text-sm font-medium text-gray-700">
                    <i class="fas fa-file-upload mr-1"></i> Select Files:
                </label>
                <input type="file" id="file-input" multiple accept=".pdf" 
                       class="w-full p-2 border rounded bg-white">
            </div>
            <button id="upload-button" class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400 auth-btn" disabled>
                <i class="fas fa-cloud-upload-alt"></i> Upload
            </button>
            <div id="status" class="mt-4"></div>
            <div id="file-list" class="mt-6 max-h-96 overflow-y-auto">
                <h2 class="text-lg font-medium mb-2"><i class="fas fa-list mr-1"></i> All Files</h2>
            </div>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="login-modal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Welcome Back</h2>
                <button onclick="closeModal('login-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="login-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="login-email" placeholder="your@email.com" 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div>
                    <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="login-password" placeholder="••••••••" 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div id="login-status" class="text-center py-2"></div>
                <button onclick="login()" class="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 auth-btn">
                    Login
                </button>
                <div class="flex items-center my-4">
                    <div class="flex-1 border-t border-gray-200"></div>
                    <span class="px-3 text-gray-500">or</span>
                    <div class="flex-1 border-t border-gray-200"></div>
                </div>
                <button onclick="signInWithGoogle()" class="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 auth-btn flex items-center justify-center">
                    <i class="fab fa-google mr-3"></i> Continue with Google
                </button>
                <div class="text-center text-sm text-gray-600 mt-4">
                    Don't have an account? 
                    <button onclick="openModal('signup-modal'); closeModal('login-modal')" class="text-blue-600 hover:text-blue-800 font-medium">
                        Sign up
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Signup Modal -->
    <div id="signup-modal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Create Account</h2>
                <button onclick="closeModal('signup-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="signup-email" placeholder="your@email.com" 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div>
                    <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="signup-password" placeholder="••••••••" 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div id="signup-status" class="text-center py-2"></div>
                <button onclick="signup()" class="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 auth-btn">
                    Create Account
                </button>
                <div class="flex items-center my-4">
                    <div class="flex-1 border-t border-gray-200"></div>
                    <span class="px-3 text-gray-500">or</span>
                    <div class="flex-1 border-t border-gray-200"></div>
                </div>
                <button onclick="signInWithGoogle()" class="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 auth-btn flex items-center justify-center">
                    <i class="fab fa-google mr-3"></i> Continue with Google
                </button>
                <div class="text-center text-sm text-gray-600 mt-4">
                    Already have an account? 
                    <button onclick="openModal('login-modal'); closeModal('signup-modal')" class="text-blue-600 hover:text-blue-800 font-medium">
                        Login
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Modal -->
    <div id="edit-modal" class="modal">
        <div class="modal-content">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Edit File</h2>
                <button onclick="closeModal('edit-modal')" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label for="edit-folder" class="block text-sm font-medium text-gray-700 mb-1">Institute Name</label>
                    <input type="text" id="edit-folder" placeholder="Enter institute name..." 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div>
                    <label for="edit-subfolder" class="block text-sm font-medium text-gray-700 mb-1">Test Name (optional)</label>
                    <input type="text" id="edit-subfolder" placeholder="Enter test name..." 
                           class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                </div>
                <div id="edit-status" class="text-center py-2"></div>
                <button onclick="saveEdit()" class="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 auth-btn">
                    Save Changes
                </button>
            </div>
        </div>
    </div>

    <script src="/js/admin.js"></script>
</body>
</html>
  `);
});

module.exports = app;
