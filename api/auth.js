import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp();
const auth = getAuth(app);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { idToken } = req.body;
      const decodedToken = await auth.verifyIdToken(idToken);
      res.status(200).json({ uid: decodedToken.uid });
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
