// Usage: node scripts/seedAdmin.js admin@college.edu "StrongPassword123" "Admin Name"
// Credentials code me hardcode nahi hain; command-line se aate hain.
require('dotenv').config();
const { auth, db } = require('../config/firebase');

(async () => {
  const [email, password, name = 'CampusHub Admin'] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error('Usage: node scripts/seedAdmin.js <email> <password (min 8 chars)> [name]');
    process.exit(1);
  }
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log('Auth user already exists, promoting to admin...');
  } catch {
    user = await auth.createUser({ email, password, displayName: name });
  }
  await db.collection('users').doc(user.uid).set({
    uid: user.uid, email, name, role: 'admin', status: 'active',
    department: 'Administration', semester: null, studentId: null, photoURL: '',
    createdAt: new Date().toISOString(),
  });
  console.log(`Admin ready: ${email} (uid: ${user.uid})`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });