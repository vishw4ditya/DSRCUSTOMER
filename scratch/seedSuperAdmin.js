import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAjN8rGC_1wkzpyl2XskihA5FiWyts_G0E',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'dsrcustomer.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'dsrcustomer',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'dsrcustomer.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '129826990885',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:129826990885:web:4c4d04bdf445e6107488cc',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedSuperAdmin() {
  const phone = '9800780500';
  const email = 'admin@karnalikrishna.com'; // primary email
  const phoneEmail = '9800780500@dsr.com'; // alias email
  const password = 'Admin@168#';

  console.log('Seeding SuperAdmin to Firebase...');
  console.log('Phone:', phone);
  console.log('Password:', password);

  let user = null;

  // Try creating primary admin account
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log('Successfully created Firebase Auth user for email:', email, 'UID:', user.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('Email', email, 'already exists. Logging in to update profile...');
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
        console.log('Logged in successfully. UID:', user.uid);
      } catch (loginErr) {
        console.error('Login failed:', loginErr.message);
      }
    } else {
      console.error('Error creating user with email:', err.message);
    }
  }

  // Also try creating phone-alias admin account if primary was created or separate
  let phoneUser = null;
  try {
    const cred = await createUserWithEmailAndPassword(auth, phoneEmail, password);
    phoneUser = cred.user;
    console.log('Successfully created Firebase Auth user for phone email:', phoneEmail, 'UID:', phoneUser.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        const cred = await signInWithEmailAndPassword(auth, phoneEmail, password);
        phoneUser = cred.user;
      } catch (e) {}
    }
  }

  // Save Firestore documents
  const profileData = {
    name: 'Super Admin',
    userId: 'SA-0001',
    email: email,
    phone: phone,
    role: 'SuperAdmin',
    status: 'active',
    zoneId: null,
    branchId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const counterRef = doc(db, 'counters', 'SuperAdmin');
  await setDoc(counterRef, { role: 'SuperAdmin', lastNumber: 1, updatedAt: new Date().toISOString() }, { merge: true });

  const indexRef = doc(db, 'userIdIndex', 'SA-0001');
  await setDoc(indexRef, { userId: 'SA-0001', role: 'SuperAdmin', createdAt: new Date().toISOString() }, { merge: true });

  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...profileData, uid: user.uid, id: user.uid }, { merge: true });
    console.log('Firestore user document created/updated at users/' + user.uid);
  }

  if (phoneUser) {
    const phoneDocRef = doc(db, 'users', phoneUser.uid);
    await setDoc(phoneDocRef, { ...profileData, uid: phoneUser.uid, id: phoneUser.uid, email: phoneEmail }, { merge: true });
    console.log('Firestore user document created/updated at users/' + phoneUser.uid);
  }

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  console.error('Fatal Seeding Error:', err);
  process.exit(1);
});
