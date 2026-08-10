import { findStandardBook } from './bibleIntegrityChecker';

export interface CustomBibleEntry {
  name: string;
  verses: any[];
  createdAt?: number;
  updatedAt: number;
}

const DB_NAME = 'BethanyCustomBiblesDB';
const DB_VERSION = 1;
const STORE_NAME = 'bibles';

// In-memory cache for fast synchronous access
let inMemoryCache: Record<string, any[]> = {};
let inMemoryCacheMeta: Record<string, { createdAt: number; updatedAt: number }> = {};
let initPromise: Promise<void> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function clearIndexedDBStore(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Initialize custom bible storage:
 * Loads all items from IndexedDB into memory and migrates any legacy localStorage custom_bdf_* items.
 */
export async function initCustomBibleStorage(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const CURRENT_VERSION = 'v14';
      const versionSaved = localStorage.getItem('bible_data_version_key');
      const forceUpdateAll = versionSaved !== CURRENT_VERSION;

      if (forceUpdateAll) {
        await clearIndexedDBStore();
        inMemoryCache = {};
        inMemoryCacheMeta = {};
      }

      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      const items: CustomBibleEntry[] = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      const cache: Record<string, any[]> = {};
      const metaCache: Record<string, { createdAt: number; updatedAt: number }> = {};
      let fallbackTime = 1000;

      items.forEach((item) => {
        if (item && item.name && Array.isArray(item.verses)) {
          cache[item.name] = item.verses;
          metaCache[item.name] = {
            createdAt: item.createdAt || item.updatedAt || fallbackTime++,
            updatedAt: item.updatedAt || Date.now(),
          };
        }
      });

      // Migration: Check localStorage for legacy items and move them to IndexedDB
      if (typeof localStorage !== 'undefined') {
        const legacyKeys = Object.keys(localStorage).filter(
          (k) => k.startsWith('custom_bdf_') && k !== 'custom_bdf_verses_count'
        );

        for (const k of legacyKeys) {
          const name = k.replace('custom_bdf_', '');
          if (!cache[name]) {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  cache[name] = parsed;
                  metaCache[name] = { createdAt: fallbackTime++, updatedAt: Date.now() };
                  // Persist to IndexedDB
                  await saveCustomBible(name, parsed, false);
                }
              }
            } catch (err) {
              console.error('Migration error for', name, err);
            }
          }
          // Remove from localStorage to free up 5MB quota
          try {
            localStorage.removeItem(k);
          } catch {}
        }
        try {
          localStorage.removeItem('custom_bdf_verses_count');
        } catch {}
      }

      inMemoryCache = cache;
      inMemoryCacheMeta = metaCache;

      // Auto-populate default 3 bibles from b-data (/bible/*.json) if not already added
      try {
        const CURRENT_VERSION = 'v14';
        const versionSaved = localStorage.getItem('bible_data_version_key');
        const forceUpdateAll = versionSaved !== CURRENT_VERSION;

        const manifestRes = await fetch('/bible/bible_manifest.json');
        if (manifestRes.ok) {
          const manifestData = await manifestRes.json();
          const files: Array<{ id: string; name: string; file: string }> = manifestData.files || [];
          for (const item of files) {
            const cached = inMemoryCache[item.name];
            
            // Check for abnormal verse counts or single chapter pooling
            const gen1Verses = Array.isArray(cached)
              ? cached.filter((v) => (v.bookId === 'gen' || v.bookName === '창세기') && Number(v.chapter) === 1).length
              : 0;
            const maxVerseNum = Array.isArray(cached)
              ? Math.max(...cached.map((v) => Number(v.verse) || 0))
              : 0;

            const needsUpdate =
              forceUpdateAll ||
              !cached ||
              !Array.isArray(cached) ||
              cached.length === 0 ||
              !cached[0]?.bookName ||
              gen1Verses > 40 || // Poolede data usually has hundreds of verses in Gen 1
              maxVerseNum > 200;  // Psalms 119 has 176 verses. Anything higher is abnormal.

            if (needsUpdate) {
              try {
                const res = await fetch(item.file);
                if (res.ok) {
                  const versesData = await res.json();
                  if (Array.isArray(versesData) && versesData.length > 0) {
                    await saveCustomBible(item.name, versesData, false);
                    // Update current in-memory cache reference directly
                    inMemoryCache[item.name] = versesData;
                  }
                }
              } catch (e) {
                console.warn(`Failed to auto-load ${item.name}:`, e);
              }
            }
          }
          localStorage.setItem('bible_data_version_key', CURRENT_VERSION);
        }
      } catch (err) {
        console.warn('Failed to load bible manifest:', err);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bibleImported', { detail: {} }));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.warn('IndexedDB unavailable or failed, falling back to memory/localStorage:', err);
      if (typeof localStorage !== 'undefined') {
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('custom_bdf_') && k !== 'custom_bdf_verses_count') {
              const name = k.replace('custom_bdf_', '');
              const raw = localStorage.getItem(k);
              if (raw) {
                inMemoryCache[name] = JSON.parse(raw);
                if (!inMemoryCacheMeta[name]) {
                  inMemoryCacheMeta[name] = { createdAt: Date.now(), updatedAt: Date.now() };
                }
              }
            }
          });
        } catch {}
      }
    }
  })();

  return initPromise;
}

/**
 * Get in-memory cache of custom bibles synchronously
 */
export function getCustomBibleCache(): Record<string, any[]> {
  return inMemoryCache;
}

/**
 * Save custom bible verses into IndexedDB
 */
export async function saveCustomBible(name: string, verses: any[], triggerEvent = true): Promise<boolean> {
  const nameKey = name.trim();
  if (!nameKey || !verses || verses.length === 0) return false;

  // Normalize verses bookName & bookId
  const normalizedVerses = verses.map((v) => {
    const std = (v as any).bookId ? findStandardBook((v as any).bookId) : findStandardBook(v.bookName);
    return {
      ...v,
      bookName: std ? std.name : v.bookName,
      bookId: std ? std.id : (v as any).bookId,
    };
  });

  // Preserve existing createdAt timestamp if available, else set new
  const existingMeta = inMemoryCacheMeta[nameKey];
  const createdAt = existingMeta?.createdAt || Date.now();
  const updatedAt = Date.now();

  // Immediately update in-memory cache and meta
  inMemoryCache[nameKey] = normalizedVerses;
  inMemoryCacheMeta[nameKey] = { createdAt, updatedAt };

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const entry: CustomBibleEntry = {
      name: nameKey,
      verses: normalizedVerses,
      createdAt,
      updatedAt,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    if (triggerEvent) {
      window.dispatchEvent(new CustomEvent('bibleImported', { detail: { translationName: nameKey } }));
      window.dispatchEvent(new Event('storage'));
    }
    return true;
  } catch (err) {
    console.error('Failed to save custom bible to IndexedDB:', err);
    // In-memory update succeeded so we notify app
    if (triggerEvent) {
      window.dispatchEvent(new CustomEvent('bibleImported', { detail: { translationName: nameKey } }));
    }
    return true;
  }
}

export const PROTECTED_DEFAULT_BIBLES = [
  '킹흠정역',
  '킹제임스(KJV1769)',
  '킹제임스(KJV1611)',
  '킹제임스(KJV)',
  '킹제임스',
  '개역한글',
  'KJV1611',
  'KJV1769',
  'HKJV',
  'KJV',
  'KRV',
];

export function isProtectedBible(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim().toLowerCase();
  return PROTECTED_DEFAULT_BIBLES.some((p) => p.toLowerCase() === trimmed);
}

/**
 * Delete a custom bible from IndexedDB (Protected default bibles cannot be deleted)
 */
export async function deleteCustomBible(name: string): Promise<boolean> {
  const nameKey = name.trim();
  if (isProtectedBible(nameKey)) {
    console.warn(`[Protection] Default standard bible '${nameKey}' cannot be deleted.`);
    return false;
  }

  delete inMemoryCache[nameKey];
  delete inMemoryCacheMeta[nameKey];

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(nameKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(`custom_bdf_${nameKey}`);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('bibleImported', { detail: { translationName: nameKey } }));
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (err) {
    console.error('Failed to delete custom bible from IndexedDB:', err);
    return false;
  }
}

/**
 * Get current uploaded custom bibles list (sorted by earliest uploaded first)
 */
export function getUploadedBibleList(): Array<{ name: string; count: number; createdAt: number }> {
  const list: Array<{ name: string; count: number; createdAt: number }> = [];
  Object.keys(inMemoryCache).forEach((name) => {
    const verses = inMemoryCache[name];
    const meta = inMemoryCacheMeta[name];
    list.push({
      name,
      count: Array.isArray(verses) ? verses.length : 0,
      createdAt: meta?.createdAt || 0,
    });
  });
  // Sort oldest first (first uploaded appears at top, newly uploaded added at bottom)
  list.sort((a, b) => a.createdAt - b.createdAt);
  return list;
}
