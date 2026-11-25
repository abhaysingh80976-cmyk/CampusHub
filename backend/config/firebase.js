require('dotenv').config();
const admin = require('firebase-admin');

const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Check backend/.env`);
  process.exit(1);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY.trim().replace(/^"|"$/g, '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();

// Files Firestore ke "files" collection me hain. Controllers me bucket.file(id).delete()
// likha hai, isliye ye chhota wrapper file ka document delete kar deta hai.
const bucket = {
  file: (id) => ({
    delete: async () => {
      if (id) await db.collection('files').doc(String(id)).delete();
    },
  }),
};

module.exports = { admin, db, auth: admin.auth(), bucket };