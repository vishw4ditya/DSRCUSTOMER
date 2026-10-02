import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';

export async function getFollowUps(filters = []) {
  return await getCollectionDocs(COLLECTIONS.FOLLOW_UPS, filters);
}

export async function addFollowUp(data) {
  return await addFirestoreDoc(COLLECTIONS.FOLLOW_UPS, data);
}

export async function updateFollowUp(id, data) {
  return await updateFirestoreDoc(COLLECTIONS.FOLLOW_UPS, id, data);
}

export async function deleteFollowUp(id) {
  return await deleteFirestoreDoc(COLLECTIONS.FOLLOW_UPS, id);
}
