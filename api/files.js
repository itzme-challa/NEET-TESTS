import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirebaseConfig } from '../../config/firebase.js';

const app = initializeApp({
    credential: cert(getFirebaseConfig())
});

const db = getDatabase(app);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const { pdfId } = req.query;
            
            if (!pdfId) {
                return res.status(400).json({ error: 'PDF ID is required' });
            }

            const snapshot = await db.ref('files')
                .orderByChild('pdfId')
                .equalTo(pdfId)
                .once('value');
            
            if (snapshot.exists()) {
                const fileData = snapshot.val();
                res.status(200).json(fileData);
            } else {
                res.status(404).json({ error: 'PDF not found' });
            }
        } catch (error) {
            console.error('Files error:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
