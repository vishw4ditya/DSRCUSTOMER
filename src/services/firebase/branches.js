import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';
import { where } from 'firebase/firestore';

export async function getBranches(zoneId = null) {
  const filters = zoneId ? [where('zoneId', '==', zoneId)] : [];
  return await getCollectionDocs(COLLECTIONS.BRANCHES, filters);
}

export async function addBranch(branchData) {
  return await addFirestoreDoc(COLLECTIONS.BRANCHES, branchData);
}

export async function updateBranch(branchId, branchData) {
  return await updateFirestoreDoc(COLLECTIONS.BRANCHES, branchId, branchData);
}

export async function deleteBranch(branchId) {
  return await deleteFirestoreDoc(COLLECTIONS.BRANCHES, branchId);
}
