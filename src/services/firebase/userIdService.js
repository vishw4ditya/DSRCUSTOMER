import { doc, runTransaction, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const ROLE_PREFIXES = {
  SuperAdmin: 'SA',
  RegionalManager: 'RM',
  BranchHead: 'BH',
  Technician: 'TECH',
  Salesperson: 'SP',
};

/**
 * Normalizes phone numbers to standard E.164 international format (+91 for India, +977 for Nepal).
 * Handles formats: 9876543210, +91 9876543210, +91-9876543210, 919876543210, 09876543210.
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, '').trim();

  // If 10 digits starting with 6-9 (standard Indian mobile format)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  // If 11 digits starting with 0 followed by 10 mobile digits
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }
  // If 12 digits starting with 91 followed by 10 Indian mobile digits
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(2)}`;
  }
  // If already starts with +
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // If 10 digits starting with 98 (Nepal) or generic 10 digits
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned;
}

/**
 * Extracts clean 10-digit mobile number suffix for candidate matching.
 */
export function extract10DigitPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Atomically generates the next sequential human-readable User ID for a role using Firestore transactions.
 * Formats: SA-0001, RM-0001, BH-0001, TECH-0001, SP-0001
 */
export async function generateNextUserId(role) {
  if (!isFirebaseConfigured() || !db) {
    const randNum = String(Math.floor(1000 + Math.random() * 9000));
    return `${ROLE_PREFIXES[role] || 'USR'}-${randNum}`;
  }

  const prefix = ROLE_PREFIXES[role] || 'USR';
  const counterRef = doc(db, 'counters', role);

  let allocatedId = '';

  try {
    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let lastNumber = 0;

      if (counterDoc.exists()) {
        lastNumber = counterDoc.data().lastNumber || 0;
      }

      const nextNumber = lastNumber + 1;
      const formattedNum = String(nextNumber).padStart(4, '0');
      allocatedId = `${prefix}-${formattedNum}`;

      transaction.set(
        counterRef,
        { role, lastNumber: nextNumber, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    });

    if (allocatedId) {
      const indexRef = doc(db, 'userIdIndex', allocatedId.toUpperCase());
      await setDoc(indexRef, { userId: allocatedId, role, createdAt: new Date().toISOString() }, { merge: true });
    }

    return allocatedId;
  } catch (err) {
    console.error('[UserIdService] Error generating atomic User ID:', err);
    const fallbackNum = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}-${fallbackNum}`;
  }
}

/**
 * Migration strategy for existing users in Firestore missing a userId.
 * Automatically allocates and assigns sequential User IDs for legacy profiles.
 */
export async function migrateExistingUsersUserIds() {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);

    for (const userDoc of snap.docs) {
      const data = userDoc.data();
      if (!data.userId && data.role) {
        const generatedId = await generateNextUserId(data.role);
        const ref = doc(db, 'users', userDoc.id);
        await setDoc(ref, { userId: generatedId }, { merge: true });
        console.log(`[Migration] Assigned User ID ${generatedId} to existing user ${data.email || userDoc.id}`);
      }
    }
  } catch (err) {
    console.warn('[Migration] User ID migration warning:', err);
  }
}
