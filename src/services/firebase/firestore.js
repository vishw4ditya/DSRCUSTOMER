import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export const COLLECTIONS = {
  USERS: 'users',
  SUPER_ADMINS: 'superAdmins',
  REGIONAL_MANAGERS: 'regionalManagers',
  BRANCH_HEADS: 'branchHeads',
  TECHNICIANS: 'technicians',
  SALESPERSONS: 'salespersons',
  CUSTOMERS: 'customers',
  VISITS: 'visits',
  LEADS: 'leads',
  FOLLOW_UPS: 'followUps',
  BRANCHES: 'branches',
  ZONES: 'zones',
  NOTIFICATIONS: 'notifications',
};

export const ROLE_COLLECTIONS = {
  SuperAdmin: 'superAdmins',
  RegionalManager: 'regionalManagers',
  BranchHead: 'branchHeads',
  Technician: 'technicians',
  Salesperson: 'salespersons',
};

// Fetch documents from a collection with optional filters
export async function getCollectionDocs(collectionName, filterQueries = []) {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    let q = collection(db, collectionName);
    if (filterQueries.length > 0) {
      q = query(q, ...filterQueries);
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn(`[Firestore] Error fetching ${collectionName}:`, err);
    throw err;
  }
}

// Subscribe to real-time updates on a Firestore collection
export function subscribeCollectionDocs(collectionName, callback, filterQueries = []) {
  if (!isFirebaseConfigured() || !db) return () => {};
  try {
    let q = collection(db, collectionName);
    if (filterQueries.length > 0) {
      q = query(q, ...filterQueries);
    }
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  } catch (err) {
    console.warn(`[Firestore Realtime] Error listening to ${collectionName}:`, err);
    return () => {};
  }
}

// Add a document to a collection
export async function addFirestoreDoc(collectionName, data) {
  if (!isFirebaseConfigured() || !db) return null;
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Update a document in a collection
export async function updateFirestoreDoc(collectionName, docId, data) {
  if (!isFirebaseConfigured() || !db) return;
  const ref = doc(db, collectionName, docId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Delete a document from a collection
export async function deleteFirestoreDoc(collectionName, docId) {
  if (!isFirebaseConfigured() || !db) return;
  await deleteDoc(doc(db, collectionName, docId));
}
