import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';

export async function getLeads(filters = []) {
  return await getCollectionDocs(COLLECTIONS.LEADS, filters);
}

export async function addLead(leadData) {
  return await addFirestoreDoc(COLLECTIONS.LEADS, leadData);
}

export async function updateLead(leadId, leadData) {
  return await updateFirestoreDoc(COLLECTIONS.LEADS, leadId, leadData);
}

export async function deleteLead(leadId) {
  return await deleteFirestoreDoc(COLLECTIONS.LEADS, leadId);
}
