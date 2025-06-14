const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

module.exports = async (req, res) => {
  try {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pdfid } = req.query;

    if (pdfid) {
      // Get specific PDF by ID
      const snapshot = await db.ref('files').orderByChild('pdfId').equalTo(pdfid).once('value');
      if (snapshot.exists()) {
        let fileData = null;
        snapshot.forEach(child => {
          fileData = child.val();
        });
        return res.status(200).json(fileData);
      } else {
        return res.status(404).json({ error: 'PDF not found' });
      }
    } else {
      // Get all files
      const snapshot = await db.ref('files').once('value');
      if (snapshot.exists()) {
        const files = [];
        snapshot.forEach(child => {
          files.push(child.val());
        });
        return res.status(200).json(files);
      } else {
        return res.status(200).json([]);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
