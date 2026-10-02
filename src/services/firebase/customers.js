import { getCollectionDocs, addFirestoreDoc, updateFirestoreDoc, deleteFirestoreDoc, COLLECTIONS } from './firestore';

export async function getCustomers(filters = []) {
  return await getCollectionDocs(COLLECTIONS.CUSTOMERS, filters);
}

export async function addCustomer(customerData) {
  return await addFirestoreDoc(COLLECTIONS.CUSTOMERS, customerData);
}

export async function updateCustomer(customerId, customerData) {
  return await updateFirestoreDoc(COLLECTIONS.CUSTOMERS, customerId, customerData);
}

export async function deleteCustomer(customerId) {
  return await deleteFirestoreDoc(COLLECTIONS.CUSTOMERS, customerId);
}
