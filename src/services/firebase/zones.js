import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';

export async function getZones() {
  return await getCollectionDocs(COLLECTIONS.ZONES);
}

export async function addZone(zoneData) {
  return await addFirestoreDoc(COLLECTIONS.ZONES, zoneData);
}

export async function updateZone(zoneId, zoneData) {
  return await updateFirestoreDoc(COLLECTIONS.ZONES, zoneId, zoneData);
}

export async function deleteZone(zoneId) {
  return await deleteFirestoreDoc(COLLECTIONS.ZONES, zoneId);
}
