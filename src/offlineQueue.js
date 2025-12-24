/**
 * Offline Queue Manager
 * Handles Firestore writes when offline using IndexedDB
 * Includes concurrent initialization protection
 */

const DB_NAME = 'ppz-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'writes';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Singleton state
let db = null;
let initPromise = null;
let initLock = false;

/**
 * Initialize IndexedDB with concurrent access protection
 * Critical fix: prevents database corruption from simultaneous initialization
 */
export async function initOfflineQueue() {
  // Return existing DB if already initialized
  if (db) {
    return db;
  }

  // Return existing promise if initialization in progress
  if (initPromise) {
    return initPromise;
  }

  // Check lock and retry with backoff
  if (initLock) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return initOfflineQueue(); // Retry
  }

  initLock = true;

  initPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      initLock = false;
      initPromise = null;
      reject(new Error(`Failed to open IndexedDB: ${request.error}`));
    };

    request.onsuccess = () => {
      db = request.result;
      initLock = false;
      console.log('✅ Offline queue initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('operation', 'operation', { unique: false });
      }
    };
  });

  return initPromise;
}

/**
 * Queue a write operation for later execution
 */
export async function queueWrite(operation, collectionPath, data, docId = null) {
  try {
    const database = await initOfflineQueue();

    const write = {
      operation, // 'add', 'update', 'delete'
      collectionPath,
      data,
      docId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      error: null
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(write);

      request.onsuccess = () => {
        console.log(`✅ Queued ${operation} operation`);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Failed to queue write:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Queue write error:', error);
    throw error;
  }
}

/**
 * Get all queued writes
 */
export async function getQueuedWrites() {
  try {
    const database = await initOfflineQueue();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Get queued writes error:', error);
    return [];
  }
}

/**
 * Execute a single queued operation
 * Includes proper error handling for imports
 */
async function executeOperation(write) {
  try {
    // Dynamic import with error handling
    const { getFirebaseDb } = await import('./firebase.js').catch(err => {
      throw new Error(`Failed to import Firebase module: ${err.message}`);
    });

    const {
      collection,
      addDoc,
      updateDoc,
      deleteDoc,
      doc
    } = await import('firebase/firestore').catch(err => {
      throw new Error(`Failed to import Firestore module: ${err.message}`);
    });

    const db = getFirebaseDb();

    if (!db) {
      throw new Error('Firestore not initialized');
    }

    // Validate operation data
    if (!write.collectionPath) {
      throw new Error('Missing collection path');
    }

    const collectionRef = collection(db, write.collectionPath);

    switch (write.operation) {
      case 'add': {
        if (!write.data) {
          throw new Error('Missing data for add operation');
        }
        const result = await addDoc(collectionRef, write.data);
        return { success: true, id: result.id };
      }

      case 'update': {
        if (!write.docId) {
          throw new Error('Missing document ID for update operation');
        }
        if (!write.data) {
          throw new Error('Missing data for update operation');
        }
        const docRef = doc(db, write.collectionPath, write.docId);
        await updateDoc(docRef, write.data);
        return { success: true, id: write.docId };
      }

      case 'delete': {
        if (!write.docId) {
          throw new Error('Missing document ID for delete operation');
        }
        const docRef = doc(db, write.collectionPath, write.docId);
        await deleteDoc(docRef);
        return { success: true, id: write.docId };
      }

      default:
        throw new Error(`Unknown operation: ${write.operation}`);
    }
  } catch (error) {
    console.error(`❌ Execute operation error:`, error);
    throw error;
  }
}

/**
 * Process all queued writes
 */
export async function processQueue() {
  const writes = await getQueuedWrites();

  if (writes.length === 0) {
    return { processed: 0, failed: 0 };
  }

  console.log(`📤 Processing ${writes.length} queued writes...`);

  let processed = 0;
  let failed = 0;

  for (const write of writes) {
    try {
      await executeOperation(write);
      await removeWrite(write.id);
      processed++;
      console.log(`✅ Processed write ${write.id}`);
    } catch (error) {
      console.error(`❌ Failed to process write ${write.id}:`, error);

      if (write.retryCount < MAX_RETRIES) {
        await updateWrite(write.id, {
          status: 'retrying',
          retryCount: write.retryCount + 1,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        await updateWrite(write.id, {
          status: 'failed',
          error: error.message
        });
        failed++;
      }
    }
  }

  console.log(`✅ Queue processing complete: ${processed} processed, ${failed} failed`);

  return { processed, failed };
}

/**
 * Update a write's status
 */
async function updateWrite(id, updates) {
  const database = await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const write = request.result;
      if (write) {
        Object.assign(write, updates);
        const updateRequest = store.put(write);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a completed write
 */
async function removeWrite(id) {
  const database = await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all queued writes
 */
export async function clearQueue() {
  const database = await initOfflineQueue();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('✅ Queue cleared');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Setup online/offline event listeners
 */
export function setupOfflineSync() {
  window.addEventListener('online', async () => {
    console.log('🌐 Connection restored, processing queue...');
    await processQueue();
  });

  window.addEventListener('offline', () => {
    console.log('📴 Connection lost, writes will be queued');
  });
}
