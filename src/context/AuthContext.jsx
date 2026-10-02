import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase/config';
import { firebaseLogin, firebaseLogout, firebaseRegister, getAuthErrorMessage, isRegisteringUser } from '../services/firebase/auth';
import { COLLECTIONS } from '../services/firebase/firestore';
import { ROLES } from '../roles';

const AuthContext = createContext(null);

const IS_DEV_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

export const MOCK_DEV_USERS = {
  [ROLES.SUPER_ADMIN]: {
    uid: 'dev-admin-1',
    _id: 'dev-admin-1',
    name: 'Development Super Admin',
    email: 'admin@karnalikrishna.com',
    phone: '9800000000',
    role: ROLES.SUPER_ADMIN,
    status: 'active',
    isActive: true,
  },
  [ROLES.REGIONAL_MANAGER]: {
    uid: 'dev-rm-1',
    _id: 'dev-rm-1',
    name: 'Development Regional Manager',
    email: 'rm@karnalikrishna.com',
    phone: '9800000001',
    role: ROLES.REGIONAL_MANAGER,
    status: 'active',
    isActive: true,
  },
  [ROLES.BRANCH_HEAD]: {
    uid: 'dev-bh-1',
    _id: 'dev-bh-1',
    name: 'Development Branch Manager',
    email: 'bh@karnalikrishna.com',
    phone: '9800000002',
    role: ROLES.BRANCH_HEAD,
    status: 'active',
    isActive: true,
  },
  [ROLES.TECHNICIAN]: {
    uid: 'dev-tech-1',
    _id: 'dev-tech-1',
    name: 'Development Technician',
    email: 'tech@karnalikrishna.com',
    phone: '9800000003',
    role: ROLES.TECHNICIAN,
    status: 'active',
    isActive: true,
  },
  [ROLES.SALESPERSON]: {
    uid: 'dev-sales-1',
    _id: 'dev-sales-1',
    name: 'Development Salesperson',
    email: 'sales@karnalikrishna.com',
    phone: '9800000004',
    role: ROLES.SALESPERSON,
    status: 'active',
    isActive: true,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndSetUser = async (fbUser) => {
    if (!fbUser || !db) {
      setUser(null);
      setUserProfile(null);
      return null;
    }

    try {
      const docRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
      let snap = await getDoc(docRef);
      let profileData = null;

      if (snap.exists()) {
        profileData = { uid: snap.id, id: snap.id, ...snap.data() };
      } else {
        // Fallback: Search users collection by email if direct doc lookup missed
        console.warn('[Auth] Direct Firestore doc lookup missed for UID:', fbUser.uid, '. Running email/phone fallback search...');
        if (fbUser.email) {
          const usersRef = collection(db, COLLECTIONS.USERS);
          const emailCandidates = [
            fbUser.email,
            fbUser.email.replace('@gmail.com', '@gmai.com'),
            fbUser.email.replace('@gmai.com', '@gmail.com'),
          ];
          for (const candEmail of emailCandidates) {
            const q = query(usersRef, where('email', '==', candEmail));
            const res = await getDocs(q);
            if (!res.empty) {
              const matchedDoc = res.docs[0];
              profileData = { uid: fbUser.uid, id: fbUser.uid, ...matchedDoc.data() };
              // Self-heal profile document to match fbUser.uid
              try {
                await setDoc(doc(db, COLLECTIONS.USERS, fbUser.uid), profileData, { merge: true });
                console.log('[Auth] Self-healed Firestore profile document for UID:', fbUser.uid);
              } catch (e) {}
              break;
            }
          }
        }
      }

      if (profileData) {
        if (profileData.status === 'active') {
          const combinedUser = {
            uid: fbUser.uid,
            email: fbUser.email || profileData.email,
            ...profileData,
          };
          setUser(combinedUser);
          setUserProfile(profileData);
          return combinedUser;
        } else {
          // Unapproved, pending, rejected or disabled account
          console.warn('[Auth] User account status is not active:', profileData.status);
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          return null;
        }
      } else {
        console.warn('[Auth] No Firestore profile document found for UID:', fbUser.uid);
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        return null;
      }
    } catch (err) {
      console.error('[Auth] Error fetching user profile:', err);
      setUser(null);
      setUserProfile(null);
      return null;
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          if (isRegisteringUser(fbUser.uid)) {
            console.log('[Auth] Registration in progress for UID:', fbUser.uid, '- skipping auth state change check');
            return;
          }
          await fetchProfileAndSetUser(fbUser);
        } else {
          if (IS_DEV_BYPASS) {
            const activeDevRole = localStorage.getItem('dev_role') || ROLES.SUPER_ADMIN;
            const devUser = MOCK_DEV_USERS[activeDevRole] || MOCK_DEV_USERS[ROLES.SUPER_ADMIN];
            setUser(devUser);
            setUserProfile(devUser);
          } else {
            setUser(null);
            setUserProfile(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      if (IS_DEV_BYPASS) {
        const activeDevRole = localStorage.getItem('dev_role') || ROLES.SUPER_ADMIN;
        const devUser = MOCK_DEV_USERS[activeDevRole] || MOCK_DEV_USERS[ROLES.SUPER_ADMIN];
        setUser(devUser);
        setUserProfile(devUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const { firebaseUser, profile } = await firebaseLogin(phone, password);
      const combinedUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...profile,
      };
      setUser(combinedUser);
      setUserProfile(profile);
      setLoading(false);
      return combinedUser;
    } catch (err) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      throw err;
    }
  };

  const register = async (userData) => {
    return await firebaseRegister(userData);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn('[Auth] Error during logout:', err);
    } finally {
      if (IS_DEV_BYPASS) {
        const activeDevRole = localStorage.getItem('dev_role') || ROLES.SUPER_ADMIN;
        const devUser = MOCK_DEV_USERS[activeDevRole] || MOCK_DEV_USERS[ROLES.SUPER_ADMIN];
        setUser(devUser);
        setUserProfile(devUser);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (auth?.currentUser) {
      await fetchProfileAndSetUser(auth.currentUser);
    }
  };

  const switchDevRole = (role) => {
    if (IS_DEV_BYPASS && MOCK_DEV_USERS[role]) {
      localStorage.setItem('dev_role', role);
      setUser(MOCK_DEV_USERS[role]);
      setUserProfile(MOCK_DEV_USERS[role]);
    }
  };

  const isAuthenticated = Boolean(user && userProfile && userProfile.status === 'active');

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        refreshUser,
        isDevBypass: IS_DEV_BYPASS,
        switchDevRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
