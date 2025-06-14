import { getFileById } from './files.js';

// PDF Viewer initialization
export async function initViewer() {
    const pdfId = getQueryParam('pdfid');
    if (!pdfId) {
        showError('No PDF ID provided');
        return;
    }

    try {
        const fileData = await getFileById(pdfId);
        if (fileData) {
            const pdfUrl = fileData.url;
            await renderPDF(pdfUrl);
        }
    } catch (error) {
        showError(error.message);
    }
}

// Helper functions for PDF rendering
// ...
