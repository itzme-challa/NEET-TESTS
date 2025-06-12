const express = require('express');
const app = express();

app.get('/', (req, res) => {
  const pdfId = req.query.pdfid || '';
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Viewer</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="/css/view.css">
</head>
<body class="bg-gray-100 min-h-screen flex flex-col">
    <header class="bg-white shadow p-4 sticky top-0 z-10">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-xl font-bold text-gray-800 flex items-center">
                <i class="fas fa-file-pdf mr-2 text-red-500"></i> PDF Viewer
            </h1>
            <div class="flex items-center space-x-2">
                <button id="toggleSidebar" class="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700">
                    <i class="fas fa-th-list"></i>
                </button>
                <a id="downloadButton" href="#" class="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 hidden">
                    <i class="fas fa-download"></i>
                </a>
                <a href="/" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-arrow-left"></i>
                </a>
            </div>
        </div>
    </header>
    <main class="flex-grow container mx-auto p-4 flex">
        <div id="sidebar" class="h-full">
            <div id="thumbnails" class="p-2"></div>
        </div>
        <div class="flex-grow">
            <div id="loading" class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
            <div id="pdfViewer" class="bg-white rounded-lg shadow-lg p-4 hidden"></div>
            <div id="downloadSection" class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-lg font-semibold text-gray-800 mb-4">Unable to Load PDF</h2>
                <p class="text-gray-600 mb-4">The PDF could not be loaded. Please download it instead.</p>
                <a id="downloadLink" href="#" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-flex items-center">
                    <i class="fas fa-download mr-2"></i> Download PDF
                </a>
            </div>
            <div id="status" class="text-center mt-4"></div>
            <div id="pageInfo" class="hidden"></div>
        </div>
    </main>
    <script src="/js/view.js"></script>
</body>
</html>
  `);
});

module.exports = app;
