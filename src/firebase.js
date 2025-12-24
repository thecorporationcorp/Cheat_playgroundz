import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithCustomToken } from "firebase/auth";

let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;
let initializationPromise = null;

function validateFirebaseConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Firebase config must be an object");
  }

  const required = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId"
  ];

  const missing = required.filter(k => !config[k]);

  if (missing.length > 0) {
    throw new Error("Firebase config missing: " + missing.join(", "));
  }

  return true;
}

function sanitizeConfig(config) {
  const sanitized = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };

  if (config.measurementId) {
    sanitized.measurementId = config.measurementId;
  }

  return Object.freeze(sanitized);
}

export async function initializeFirebase(configStr) {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      if (firebaseApp && firebaseDb && firebaseAuth) {
        return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
      }

      let config;
      try {
        if (typeof configStr === "string") {
          config = JSON.parse(configStr);
        } else if (typeof configStr === "object" && configStr !== null) {
          config = configStr;
        } else {
          throw new Error("Config must be string or object");
        }
      } catch (e) {
        console.error("[Firebase] Parse failed:", e);
        showFirebaseError(e);
        return { app: null, db: null, auth: null };
      }

      try {
        validateFirebaseConfig(config);
      } catch (e) {
        console.error("[Firebase] Validation failed:", e);
        showFirebaseError(e);
        return { app: null, db: null, auth: null };
      }

      const sanitizedConfig = sanitizeConfig(config);

      firebaseApp = getApps().length === 0
        ? initializeApp(sanitizedConfig)
        : getApp();

      firebaseDb = getFirestore(firebaseApp);
      firebaseAuth = getAuth(firebaseApp);

      try {
        await enableIndexedDbPersistence(firebaseDb, { synchronizeTabs: true });
        console.log("[Firebase] Offline persistence enabled");
      } catch (e) {
        console.warn("[Firebase] Persistence issue:", e.code);
      }

      try {
        const token = import.meta.env.VITE_INITIAL_AUTH_TOKEN;
        if (token) {
          await signInWithCustomToken(firebaseAuth, token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      } catch (e) {
        console.error("[Firebase] Auth failed:", e);
      }

      return { app: firebaseApp, db: firebaseDb, auth: firebaseAuth };
    } catch (e) {
      console.error("[Firebase] Init failed:", e);
      showFirebaseError(e);
      initializationPromise = null;
      return { app: null, db: null, auth: null };
    }
  })();

  return initializationPromise;
}

function showFirebaseError(error) {
  console.error("[Firebase] Error:", error);

  try {
    const div = document.createElement("div");
    div.style.cssText =
      "position:fixed;top:0;left:0;right:0;background:#ff0000;color:#000;padding:16px;z-index:999999;font-family:monospace;font-size:12px;text-align:center;";
    div.textContent = "FIREBASE INITIALIZATION FAILED - CHECK CONSOLE";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  } catch (e) {
    console.error("[Firebase] UI error:", e);
  }
}

export function getFirebaseApp() {
  return firebaseApp;
}

export function getFirebaseDb() {
  return firebaseDb;
}

export function getFirebaseAuth() {
  return firebaseAuth;
}
