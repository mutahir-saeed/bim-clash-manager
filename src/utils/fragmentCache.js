/**
 * IndexedDB cache for parsed IFC Fragment data.
 * Stores binary fragment buffers keyed by filename + size hash,
 * enabling near-instant subsequent loads instead of re-parsing WASM.
 */

const DB_NAME = "clash-app-fragment-cache";
const DB_VERSION = 1;
const STORE_NAME = "fragments";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a cache key from filename and file size.
 * This detects when the underlying file has changed.
 */
function cacheKey(filename, sizeBytes) {
  return `${filename}__${sizeBytes}`;
}

/**
 * Save fragment binary data to IndexedDB.
 * @param {string} filename - The IFC filename
 * @param {number} sizeBytes - File size in bytes (used to detect changes)
 * @param {Uint8Array} data - The serialized fragment binary
 */
export async function saveFragments(filename, sizeBytes, data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const key = cacheKey(filename, sizeBytes);

    store.put({
      key,
      filename,
      sizeBytes,
      data,
      timestamp: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn("[FragmentCache] Failed to save:", err);
  }
}

/**
 * Load cached fragment data from IndexedDB.
 * @param {string} filename - The IFC filename
 * @param {number} sizeBytes - Expected file size
 * @returns {Uint8Array|null} The cached fragment data, or null if not found
 */
export async function loadFragments(filename, sizeBytes) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const key = cacheKey(filename, sizeBytes);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        db.close();
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("[FragmentCache] Failed to load:", err);
    return null;
  }
}

/**
 * Clear all cached fragments.
 */
export async function clearCache() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch (err) {
    console.warn("[FragmentCache] Failed to clear:", err);
  }
}
