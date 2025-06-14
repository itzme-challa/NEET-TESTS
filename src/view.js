import { database } from './firebase.js';
import { ref, query, orderByChild, equalTo, get } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const pdfViewer = document.getElementById('pdfViewer');
const loading = document.getElementById('loading');
const status = document.getElementById('status');
const downloadSection = document.getElementById('downloadSection');
const downloadLink = document.getElementById('downloadLink');
const pageInfo = document.getElementById('pageInfo');
let pdfDoc = null;
const scale = 1.5;

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function renderPage(page, pageNum) {
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';
    canvas.dataset.page = pageNum;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    pdfViewer.appendChild(canvas);

    const context = canvas.getContext('2d');
    page.render({ canvasContext: context, viewport }).promise.catch(error => {
        console.error(`Error rendering page ${pageNum}:`, error);
        status.textContent = `Failed to render page ${pageNum}`;
    });

    return canvas;
}

function updatePageInfo() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNum = parseInt(entry.target.dataset.page);
                pageInfo.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
            }
        });
    }, { threshold: 0.5 });

    Array.from(pdfViewer.children).forEach(canvas => observer.observe(canvas));
}

function renderAllPages() {
    pdfViewer.innerHTML = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(page => {
            renderPage(page, pageNum);
            if (pageNum === pdfDoc.numPages) {
                updatePageInfo();
                pageInfo.style.display = 'block';
            }
        });
    }
}

function showDownloadOption(url) {
    downloadSection.style.display = 'block';
    downloadLink.href = url;
    pdfViewer.style.display = 'none';
    loading.style.display = 'none';
    pageInfo.style.display = 'none';
}

async function loadPDF() {
    const pdfId = getQueryParam('pdfid');
    if (!pdfId) {
        status.textContent = 'No PDF ID provided';
        loading.style.display = 'none';
        return;
    }

    try {
        const filesRef = ref(database, 'files');
        const q = query(filesRef, orderByChild('pdfId'), equalTo(pdfId));
        const snapshot = await get(q);

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const fileData = childSnapshot.val();
                const pdfUrl = fileData.url;
                downloadLink.href = pdfUrl;

                pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
                    pdfDoc = pdf;
                    pdfViewer.style.display = 'block';
                    downloadSection.style.display = 'none';
                    loading.style.display = 'none';
                    renderAllPages();
                }).catch(error => {
                    console.error('Error loading PDF:', error);
                    status.textContent = 'Failed to load PDF';
                    showDownloadOption(pdfUrl);
                });
            });
        } else {
            status.textContent = 'PDF not found';
            loading.style.display = 'none';
        }
    } catch (error) {
        status.textContent = `Error: ${error.message}`;
        loading.style.display = 'none';
    }
}

loadPDF();
