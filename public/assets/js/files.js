import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const db = getDatabase();

export function loadFiles() {
    return new Promise((resolve, reject) => {
        const filesRef = ref(db, 'files');
        onValue(filesRef, (snapshot) => {
            if (snapshot.exists()) {
                resolve(snapshot.val());
            } else {
                reject(new Error("No files available"));
            }
        }, { onlyOnce: true });
    });
}

export function getFileById(pdfId) {
    return new Promise((resolve, reject) => {
        const filesRef = ref(db, 'files');
        onValue(filesRef.orderByChild('pdfId').equalTo(pdfId), (snapshot) => {
            if (snapshot.exists()) {
                resolve(snapshot.val());
            } else {
                reject(new Error("File not found"));
            }
        }, { onlyOnce: true });
    });
}
