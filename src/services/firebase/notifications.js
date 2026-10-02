import { addFirestoreDoc, getCollectionDocs, COLLECTIONS } from './firestore';
import { where } from 'firebase/firestore';

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        return true;
      }
    } catch (err) {
      console.warn('[FCM] Notification permission request error:', err);
    }
  }
  return false;
}

export function subscribeToFCMToken() {
  return () => {};
}

export async function createInAppNotification({ recipientUid, type, title, message }) {
  try {
    return await addFirestoreDoc(COLLECTIONS.NOTIFICATIONS, {
      recipientUid: recipientUid || null,
      type: type || 'info',
      title: title || 'Notification',
      message: message || '',
      timestamp: 'Just now',
      unread: true,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Notifications] Error creating in-app notification:', err);
    return null;
  }
}

export async function getUserNotifications(userUid) {
  if (!userUid) return [];
  try {
    return await getCollectionDocs(COLLECTIONS.NOTIFICATIONS, [where('recipientUid', '==', userUid)]);
  } catch (err) {
    console.warn('[Notifications] Error fetching user notifications:', err);
    return [];
  }
}
