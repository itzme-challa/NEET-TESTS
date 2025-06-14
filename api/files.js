import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp();
const db = getDatabase(app);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { pdfId } = req.query;
      const snapshot = await db.ref('files')
        .orderByChild('pdfId')
        .equalTo(pdfId)
        .once('value');
      
      if (snapshot.exists()) {
        res.status(200).json(snapshot.val());
      } else {
        res.status(404).json({ error: 'PDF not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
