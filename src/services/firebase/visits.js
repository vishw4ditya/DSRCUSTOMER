import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';

export async function getVisits(filters = []) {
  return await getCollectionDocs(COLLECTIONS.VISITS, filters);
}

export async function addVisit(visitData) {
  return await addFirestoreDoc(COLLECTIONS.VISITS, visitData);
}

export async function updateVisit(visitId, visitData) {
  return await updateFirestoreDoc(COLLECTIONS.VISITS, visitId, visitData);
}

export async function deleteVisit(visitId) {
  return await deleteFirestoreDoc(COLLECTIONS.VISITS, visitId);
}
