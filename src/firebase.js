import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Singleton instances
let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;
let initializationPromise = null;

/**
 * Validate Firebase configuration
 * Prevents runtime errors from malformed config
 */
function validateFirebaseConfig(config) {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Firebase config missing required fields: ${missing.join(', ')}`);
  }

  // Validate formats
  if (typeof config.apiKey !== 'string' || config.apiKey.length < 20) {
    throw new Error('Invalid Firebase API key format');
  }

  return true;
}

/**
 * Initialize Firebase with comprehensive error handling
 * Uses singleton pattern to prevent multiple initializations
 */
export async function initializeFirebase() {
  // Return existing instances if already initialized
  if (firebaseApp && firebaseDb && firebaseAuth) {
    return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
  }

  // Return existing promise if initialization in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Parse config from global variable or environment
      let config;
      try {
        const configStr = typeof window !== 'undefined' && window.__firebase_config
          ? window.__firebase_config
          : null;

        if (!configStr || configStr === '%VITE_FIREBASE_CONFIG%') {
          throw new Error('Firebase configuration not found. Please set VITE_FIREBASE_CONFIG environment variable.');
        }

        config = JSON.parse(configStr);
      } catch (parseError) {
        console.error('Firebase config parse error:', parseError);
        throw new Error(`Failed to parse Firebase config: ${parseError.message}`);
      }

      // Validate configuration
      try {
        validateFirebaseConfig(config);
      } catch (validationError) {
        console.error('Firebase config validation error:', validationError);
        throw validationError;
      }

      // Initialize app (or get existing)
      if (getApps().length === 0) {
        firebaseApp = initializeApp(config);
      } else {
        firebaseApp = getApp();
      }

      // Initialize Firestore with offline persistence
      firebaseDb = getFirestore(firebaseApp);

      try {
        await enableIndexedDbPersistence(firebaseDb);
        console.log('✅ Firebase offline persistence enabled');
      } catch (persistenceError) {
        if (persistenceError.code === 'failed-precondition') {
          console.warn('⚠️ Multiple tabs open, persistence only enabled in one tab');
        } else if (persistenceError.code === 'unimplemented') {
          console.warn('⚠️ Browser does not support offline persistence');
        } else {
          console.error('Persistence error:', persistenceError);
        }
      }

      // Initialize Auth
      firebaseAuth = getAuth(firebaseApp);

      // Auto sign-in
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, window.__initial_auth_token);
          console.log('✅ Signed in with custom token');
        } else {
          await signInAnonymously(firebaseAuth);
          console.log('✅ Signed in anonymously');
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        // Non-fatal - app can continue without auth
      }

      return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      initializationPromise = null; // Reset so retry is possible

      // Return null instances instead of throwing
      // This allows app to gracefully degrade
      return { app: null, db: null, auth: null, error };
    }
  })();

  return initializationPromise;
}

/**
 * Get Firebase instances (lazy initialization)
 */
export function getFirebaseApp() {
  if (!firebaseApp) {
    console.warn('Firebase not initialized yet, call initializeFirebase() first');
  }
  return firebaseApp;
}

export function getFirebaseDb() {
  if (!firebaseDb) {
    console.warn('Firestore not initialized yet, call initializeFirebase() first');
  }
  return firebaseDb;
}

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    console.warn('Firebase Auth not initialized yet, call initializeFirebase() first');
  }
  return firebaseAuth;
}
