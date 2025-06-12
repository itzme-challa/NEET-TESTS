import { firebaseConfig } from './config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, query, orderByChild, equalTo, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const pdfjsLib = window['pdfjs-dist'];

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let pdfDoc = null;
let pdfUrl = '';
const scale = 1.5;
const pdfViewer = document.getElementById('pdfViewer');
const downloadSection = document.getElementById('downloadSection');
const downloadButton = document.getElementById('downloadButton');
const downloadLink = document.getElementById('downloadLink');
const pageInfo = document.getElementById('pageInfo');
const status = document.getElementById('status');
const loading = document.getElementById('loading');
const sidebar = document.getElementById('sidebar');
const thumbnails = document.getElementById('thumbnails');
const toggleSidebar = document.getElementById('toggleSidebar');

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function renderPage(page, canvas, container) {
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.className = 'page-canvas';
    container.appendChild(canvas);

    const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport
    };
    page.render(renderContext).promise.catch(error => {
        console.error(`Error rendering page:`, error);
    });
}

function renderPages() {
    pdfViewer.innerHTML = '';
    const visiblePages = new Set();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.page);
                visiblePages.add(pageNum);
                if (!entry.target.children.length) {
                    pdfDoc.getPage(pageNum).then(page => {
                        const canvas = document.createElement('canvas');
                        canvas.dataset.page = pageNum;
                        renderPage(page, canvas, entry.target);
                    });
                }
            }
        });
    }, { threshold: 0.1 });

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        pageContainer.dataset.page = pageNum;
        pdfViewer.appendChild(pageContainer);
        observer.observe(pageContainer);
    }
}

function renderThumbnails() {
    thumbnails.innerHTML = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(page => {
            const viewport = page.getViewport({ scale: 0.2 });
            const canvas = document.createElement('canvas');
            canvas.className = 'thumbnail';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            thumbnails.appendChild(canvas);

            const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
            };
            page.render(renderContext);

            canvas.addEventListener('click', () => {
                const pageContainer = pdfViewer.children[pageNum - 1];
                pageContainer.scrollIntoView({ behavior: 'smooth' });
                sidebar.classList.remove('active');
            });
        });
    }
}

function updatePageInfo() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = Array.from(pdfViewer.children).indexOf(entry.target) + 1;
                pageInfo.textContent = `${pageNum} / ${pdfDoc.numPages}`;
            }
        });
    }, { threshold: 0.5 });

    Array.from(pdfViewer.children).forEach(child => observer.observe(child));
}

function showDownloadOption(url) {
    downloadSection.style.display = 'block';
    downloadLink.href = url;
    pdfViewer.style.display = 'none';
    pageInfo.style.display = 'none';
    sidebar.style.display = 'none';
    loading.style.display = 'none';
}

function loadPDF() {
    const pdfId = getQueryParam('pdfid');
    if (!pdfId) {
        status.innerHTML = '<div class="text-red-500">No PDF ID provided</div>';
        loading.style.display = 'none';
        return;
    }

    get(query(ref(database, 'files'), orderByChild('pdfId'), equalTo(pdfId)))
        .then(snapshot => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const fileData = childSnapshot.val();
                    pdfUrl = fileData.url;
                    downloadButton.href = pdfUrl;
                    downloadButton.classList.remove('hidden');

                    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
                        pdfDoc = pdf;
                        pdfViewer.style.display = 'block';
                        downloadSection.style.display = 'none';
                        pageInfo.style.display = 'block';
                        loading.style.display = 'none';
                        renderPages();
                        renderThumbnails();
                        updatePageInfo();
                    }).catch(error => {
                        console.error('Error loading PDF:', error);
                        status.innerHTML = '<div class="text-red-500">Failed to load PDF</div>';
                        showDownloadOption(pdfUrl);
                    });
                });
            } else {
                status.innerHTML = '<div class="text-red-500">PDF not found</div>';
                loading.style.display = 'none';
            }
        })
        .catch(error => {
            status.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
            loading.style.display = 'none';
        });
}

toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

loadPDF();
