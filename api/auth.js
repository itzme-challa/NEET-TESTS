import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseConfig } from '../../config/firebase.js';

const app = initializeApp({
    credential: cert(getFirebaseConfig())
});

const auth = getAuth(app);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { idToken } = req.body;
            const decodedToken = await auth.verifyIdToken(idToken);
            
            // You can add additional user data lookup here if needed
            res.status(200).json({ 
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || ''
            });
        } catch (error) {
            console.error('Auth error:', error);
            res.status(401).json({ error: 'Unauthorized' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
