import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { db, firebaseConfig, isFirebaseConfigured } from './config';
import { COLLECTIONS, ROLE_COLLECTIONS } from './firestore';
import { getBranches } from './branches';
import { createInAppNotification } from './notifications';
import { generateNextUserId, normalizePhoneNumber, extract10DigitPhone } from './userIdService';

export async function getUserProfile(uid) {
  if (!isFirebaseConfigured() || !db || !uid) return null;
  try {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { uid: snap.id, id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.warn(`[Users Service] Error fetching user profile ${uid}:`, err);
    return null;
  }
}

export async function updateUserProfile(uid, data) {
  if (!isFirebaseConfigured() || !db || !uid) return;
  const updatePayload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, updatePayload);

  // Sync update to the role-specific separate collection
  try {
    const existingProfile = await getUserProfile(uid);
    const role = data.role || existingProfile?.role;
    const roleCol = ROLE_COLLECTIONS[role];
    if (roleCol) {
      await setDoc(doc(db, roleCol, uid), updatePayload, { merge: true });
    }
  } catch (e) {
    console.warn('[Users Service] Error syncing role collection update:', e);
  }
}

export async function getAllUsers(filters = {}) {
  if (!isFirebaseConfigured() || !db) return [];
  try {
    const targetCollection = (filters.role && ROLE_COLLECTIONS[filters.role]) || COLLECTIONS.USERS;
    let q = collection(db, targetCollection);
    const conditions = [];
    if (filters.role && targetCollection === COLLECTIONS.USERS) conditions.push(where('role', '==', filters.role));
    if (filters.status) conditions.push(where('status', '==', filters.status));
    if (filters.zoneId) conditions.push(where('zoneId', '==', filters.zoneId));
    if (filters.branchId) conditions.push(where('branchId', '==', filters.branchId));

    if (conditions.length > 0) {
      q = query(q, ...conditions);
    }
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ uid: d.id, id: d.id, ...d.data() }));

    // Fallback: If role collection was queried but returned 0 docs, query main users and mirror
    if (results.length === 0 && targetCollection !== COLLECTIONS.USERS && filters.role) {
      let fallbackQ = collection(db, COLLECTIONS.USERS);
      const fallbackConds = [where('role', '==', filters.role)];
      if (filters.status) fallbackConds.push(where('status', '==', filters.status));
      if (filters.zoneId) fallbackConds.push(where('zoneId', '==', filters.zoneId));
      if (filters.branchId) fallbackConds.push(where('branchId', '==', filters.branchId));
      const fallbackSnap = await getDocs(query(fallbackQ, ...fallbackConds));
      const fallbackResults = fallbackSnap.docs.map((d) => ({ uid: d.id, id: d.id, ...d.data() }));

      // Mirror fallback results into the role collection
      for (const item of fallbackResults) {
        try {
          await setDoc(doc(db, targetCollection, item.uid), item, { merge: true });
        } catch (e) {}
      }
      return fallbackResults;
    }

    return results;
  } catch (err) {
    console.warn('[Users Service] Error fetching users:', err);
    return [];
  }
}

export async function getPendingUsers(zoneId = null, branchId = null) {
  try {
    const allPending = await getAllUsers({ status: 'pending' });
    return allPending.filter((u) => {
      if (branchId) {
        return u.branchId === branchId;
      }
      if (zoneId) {
        return u.zoneId === zoneId;
      }
      return true; // SuperAdmin gets all pending registrations
    });
  } catch (err) {
    console.warn('[Users Service] Error fetching pending users:', err);
    return [];
  }
}

export async function approveUser(targetUid, callerUser = null) {
  const targetUser = await getUserProfile(targetUid);
  if (!targetUser) {
    throw new Error('User profile not found.');
  }

  let approvalMessage = 'Your account has been approved.';

  // Permission check for BranchHead
  if (callerUser && callerUser.role === 'BranchHead') {
    if (!callerUser.branchId || targetUser.branchId !== callerUser.branchId) {
      throw new Error('Permission denied: You can only approve users in your assigned branch.');
    }
    approvalMessage = 'Your account has been approved by your Branch Head.';
  } else if (callerUser && callerUser.role === 'RegionalManager') {
    if (!callerUser.zoneId || targetUser.zoneId !== callerUser.zoneId) {
      throw new Error('Permission denied: You can only approve users in your assigned zone.');
    }
    approvalMessage = 'Your account has been approved by the Regional Manager.';
  }

  await updateUserProfile(targetUid, { status: 'active', isActive: true });

  // Send in-app notification to approved user
  await createInAppNotification({
    recipientUid: targetUid,
    type: 'approval',
    title: 'Account Approved',
    message: approvalMessage,
  });
}

export async function rejectUser(targetUid, reason = '', callerUser = null) {
  const targetUser = await getUserProfile(targetUid);
  if (!targetUser) {
    throw new Error('User profile not found.');
  }

  // Permission check for BranchHead
  if (callerUser && callerUser.role === 'BranchHead') {
    if (!callerUser.branchId || targetUser.branchId !== callerUser.branchId) {
      throw new Error('Permission denied: You can only reject users in your assigned branch.');
    }
  } else if (callerUser && callerUser.role === 'RegionalManager') {
    if (!callerUser.zoneId || targetUser.zoneId !== callerUser.zoneId) {
      throw new Error('Permission denied: You can only reject users in your assigned zone.');
    }
  }

  await updateUserProfile(targetUid, {
    status: 'rejected',
    rejectionReason: reason || '',
    isActive: false,
  });

  // Send in-app notification to rejected user
  await createInAppNotification({
    recipientUid: targetUid,
    type: 'rejection',
    title: 'Account Registration Rejected',
    message: `Your account registration was rejected. ${reason ? 'Reason: ' + reason : ''}`,
  });
}

export async function disableUser(uid, callerUser = null) {
  if (callerUser && callerUser.role === 'BranchHead') {
    const targetUser = await getUserProfile(uid);
    if (!targetUser || targetUser.branchId !== callerUser.branchId) {
      throw new Error('Permission denied: You can only disable users in your assigned branch.');
    }
  }
  return updateUserProfile(uid, { status: 'disabled', isActive: false });
}

export async function enableUser(uid, callerUser = null) {
  if (callerUser && callerUser.role === 'BranchHead') {
    const targetUser = await getUserProfile(uid);
    if (!targetUser || targetUser.branchId !== callerUser.branchId) {
      throw new Error('Permission denied: You can only enable users in your assigned branch.');
    }
  }
  return updateUserProfile(uid, { status: 'active', isActive: true });
}

export async function deleteUser(uid) {
  if (!isFirebaseConfigured() || !db || !uid) return;
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await deleteDoc(ref);
}

/**
 * Safely creates a new user on behalf of an authenticated SuperAdmin, RegionalManager, or BranchHead.
 * Generates an atomic sequential User ID (e.g. SA-0001, RM-0001, BH-0001, TECH-0001, SP-0001).
 * Uses a secondary Firebase App instance so the caller's primary browser session is NOT disturbed.
 * Performs atomic rollback of Firebase Auth user if Firestore creation fails.
 */
export async function createNewUserByAdmin(userData, callerUser) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration unavailable.');
  }

  if (!callerUser || callerUser.status !== 'active') {
    throw new Error('Permission denied: Active administrative account required.');
  }

  const isSuperAdmin = callerUser.role === 'SuperAdmin';
  const isRegionalManager = callerUser.role === 'RegionalManager';
  const isBranchHead = callerUser.role === 'BranchHead';

  if (!isSuperAdmin && !isRegionalManager && !isBranchHead) {
    throw new Error('Permission denied: Only SuperAdmin, RegionalManager, or BranchHead can create users.');
  }

  const { name, email, phone, role, zoneId, branchId, status, password } = userData;

  console.log('[Staff Create] Request started');

  if (!name?.trim()) {
    throw new Error('Please enter the full name.');
  }

  if (!email?.trim()) {
    throw new Error('Please enter a valid email address.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address.');
  }
  console.log('[Staff Create] Email validation successful:', email.trim());

  if (!phone?.trim()) {
    throw new Error('Please enter a valid phone number.');
  }

  const normalizedPhone = normalizePhoneNumber(phone.trim());
  if (!normalizedPhone || !/^\+\d{10,15}$/.test(normalizedPhone)) {
    throw new Error('Please enter a valid phone number.');
  }
  console.log('[Staff Create] Phone normalized successfully:', normalizedPhone);

  if (!password || password.trim().length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  if (!role) {
    throw new Error('Please select a role.');
  }

  let finalRole = role;
  let finalZoneId = zoneId || null;
  let finalBranchId = branchId || null;
  let finalStatus = status || 'active';

  // BranchHead Restrictions
  if (isBranchHead) {
    if (!callerUser.zoneId || !callerUser.branchId) {
      throw new Error('Branch Head account is missing mandatory Zone or Branch assignment.');
    }
    if (role === 'SuperAdmin' || role === 'RegionalManager' || role === 'BranchHead') {
      throw new Error('Branch Heads are authorized to create only Salesperson and Technician accounts.');
    }
    if (role !== 'Salesperson' && role !== 'Technician') {
      throw new Error('Branch Heads can create only Salesperson or Technician accounts.');
    }

    finalZoneId = callerUser.zoneId;
    finalBranchId = callerUser.branchId;
    finalStatus = 'pending';
  } else if (isRegionalManager) {
    // RegionalManager Restrictions
    if (!callerUser.zoneId) {
      throw new Error('Regional Manager account is missing a mandatory Zone assignment.');
    }
    if (role === 'SuperAdmin' || role === 'RegionalManager') {
      throw new Error('Regional Managers are not authorized to create SuperAdmin or RegionalManager accounts.');
    }

    finalZoneId = callerUser.zoneId;
    finalStatus = 'pending';

    if (branchId) {
      const availableBranches = await getBranches(callerUser.zoneId);
      const branchExistsInZone = availableBranches.some(
        (b) => (b.id || b._id) === branchId
      );
      if (!branchExistsInZone) {
        throw new Error('Selected branch does not belong to your assigned zone.');
      }
      finalBranchId = branchId;
    }
  } else if (isSuperAdmin) {
    if (role === 'SuperAdmin') {
      finalZoneId = null;
      finalBranchId = null;
    }
  }

  // Validate Zone & Branch requirements
  const needsZone = finalRole !== 'SuperAdmin';
  const needsBranch = ['BranchHead', 'Technician', 'Salesperson'].includes(finalRole);

  if (needsZone && !finalZoneId) {
    throw new Error('Please select a zone.');
  }

  if (needsBranch && !finalBranchId) {
    throw new Error('Please select a branch.');
  }

  // Check whether the phone number or email already exists in Firestore
  if (db) {
    const usersRef = collection(db, COLLECTIONS.USERS);

    // 1. Check duplicate email in Firestore
    const qEmail = query(usersRef, where('email', '==', email.trim()));
    const emailSnap = await getDocs(qEmail);
    if (!emailSnap.empty) {
      throw new Error('An account with this email address already exists.');
    }

    // 2. Check duplicate phone in Firestore
    const qPhone = query(usersRef, where('phone', '==', normalizedPhone));
    const phoneSnap = await getDocs(qPhone);
    if (!phoneSnap.empty) {
      throw new Error('This phone number is already registered.');
    }

    // Fallback check for 10-digit suffix matching
    const tenDigits = extract10DigitPhone(phone);
    if (tenDigits) {
      const allSnap = await getDocs(usersRef);
      const phoneExists = allSnap.docs.some((d) => {
        const p = d.data().phone;
        if (!p) return false;
        const pClean = String(p).replace(/\D/g, '');
        return pClean.endsWith(tenDigits);
      });
      if (phoneExists) {
        throw new Error('This phone number is already registered.');
      }
    }
  }

  console.log('[Staff Create] Duplicate checks passed');

  // Create secondary Firebase App instance so primary login session is untouched
  const secondaryAppName = `AdminUserCreator_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let newUid = null;

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password.trim());
    newUid = userCredential.user.uid;
    console.log('[Staff Create] Firebase Auth user created:', newUid);

    // Atomically generate User ID (SA-0001, RM-0001, BH-0001, TECH-0001, SP-0001)
    const userId = await generateNextUserId(finalRole);
    console.log('[Staff Create] User ID generated:', userId);

    const profileData = {
      uid: newUid,
      id: newUid,
      userId: userId,
      name: name.trim(),
      email: email.trim(),
      phone: normalizedPhone,
      authPassword: password.trim(),
      role: finalRole,
      status: finalStatus,
      isActive: finalStatus === 'active',
      zoneId: finalZoneId || null,
      branchId: finalBranchId || null,
      createdBy: callerUser?.uid || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (db) {
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, newUid), {
          ...profileData,
          createdAtServer: serverTimestamp(),
        });

        // Save into role-specific separate collection
        const roleColName = ROLE_COLLECTIONS[finalRole];
        if (roleColName) {
          await setDoc(doc(db, roleColName, newUid), {
            ...profileData,
            createdAtServer: serverTimestamp(),
          });
          console.log(`[Staff Create] Saved profile to separate role collection '${roleColName}' for UID: ${newUid}`);
        }

        // Write User ID index
        await setDoc(doc(db, 'userIdIndex', userId.toUpperCase()), {
          uid: newUid,
          userId: userId,
          role: finalRole,
          createdAt: new Date().toISOString(),
        });

        // Maintain phone index document for login lookup
        await setDoc(
          doc(db, 'phoneIndex', normalizedPhone),
          {
            uid: newUid,
            email: email.trim(),
            phone: normalizedPhone,
            authPassword: password.trim(),
            userId: userId,
            status: finalStatus,
            role: finalRole,
          },
          { merge: true }
        );

        console.log('[Staff Create] Firestore profile created');
      } catch (firestoreErr) {
        console.error('[Staff Create] Firestore creation failed after Auth creation. Rolling back Auth user...', firestoreErr);
        if (secondaryAuth.currentUser) {
          try {
            await secondaryAuth.currentUser.delete();
            console.log('[Staff Create] Auth user rolled back successfully.');
          } catch (delErr) {
            console.warn('[Staff Create] Rollback delete error:', delErr);
          }
        }
        throw new Error('Failed to create user profile in database. Auth creation rolled back.');
      }
    }

    console.log('[Staff Create] User creation completed');

    // Release secondary auth instance
    await secondarySignOut(secondaryAuth);

    return { uid: newUid, userId, profile: profileData };
  } catch (err) {
    console.error('[Staff Create] Admin Create User error:', err);
    if (secondaryAuth.currentUser) {
      try {
        await secondarySignOut(secondaryAuth);
      } catch (e) {}
    }

    if (err.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists.');
    }
    if (err.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    if (err.code === 'auth/weak-password' || err.code === 'auth/invalid-password') {
      throw new Error('Password must be at least 8 characters long.');
    }
    if (err.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    throw new Error(err.message || 'Failed to create user account.');
  }
}

/**
 * Utility to inspect existing users in Firestore and check for integrity (missing User IDs, roles, etc.).
 */
export async function checkOrphanUsers() {
  if (!isFirebaseConfigured() || !db) return { missingUserIds: [], invalidProfiles: [] };
  try {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const snap = await getDocs(usersRef);
    const missingUserIds = [];
    const invalidProfiles = [];

    snap.docs.forEach((d) => {
      const data = d.data();
      if (!data.userId) {
        missingUserIds.push({ uid: d.id, ...data });
      }
      if (!data.email || !data.phone || !data.role) {
        invalidProfiles.push({ uid: d.id, ...data });
      }
    });

    return { missingUserIds, invalidProfiles };
  } catch (err) {
    console.warn('[Users Service] Error inspecting orphan users:', err);
    return { missingUserIds: [], invalidProfiles: [] };
  }
}

