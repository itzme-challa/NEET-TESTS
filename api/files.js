const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const database = admin.database();

module.exports = async (req, res) => {
    try {
        const snapshot = await database.ref('files').once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'No files found' });
        }

        const folderData = {};
        snapshot.forEach(childSnapshot => {
            const fileData = childSnapshot.val();
            const { folder, subfolder, name, pdfId, date } = fileData;
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
                        current[sf]['_files'].push({ name, pdfId, date: formattedDate });
                    }
                    current = current[sf];
                });
            } else {
                if (!folderData[folder]['_files']) folderData[folder]['_files'] = [];
                folderData[folder]['_files'].push({ name, pdfId, date: formattedDate });
            }
        });

        res.status(200).json(folderData);
    } catch (error) {
        res.status(500).json({ error: `Error loading files: ${error.message}` });
    }
};
