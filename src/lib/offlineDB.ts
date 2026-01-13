import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types pour les données cachées
export interface CacheMetadata {
  key: string;
  lastUpdated: number;
  expiresAt: number;
}

export interface ProductCache {
  id: string;
  data: any; // Product type
  cachedAt: number;
}

export interface ReferenceDataCache {
  type: 'category' | 'unit' | 'zone';
  id: string;
  data: any;
  cachedAt: number;
}

export interface UserCartCache {
  userId: string;
  items: any[]; // CartItem[]
  lastSynced: number;
}

export type SyncActionType =
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'UPDATE_CART_QUANTITY'
  | 'SUBMIT_EXIT_REQUEST';

export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

export interface SyncQueueItem {
  id?: number;
  action: SyncActionType;
  payload: any;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
}

export interface ConflictLogEntry {
  id?: number;
  action: SyncActionType;
  localData: any;
  remoteData: any;
  resolution: string;
  timestamp: number;
}

// Schema de la base de données IndexedDB
interface OfflineDBSchema extends DBSchema {
  cache_metadata: {
    key: string;
    value: CacheMetadata;
  };
  products_cache: {
    key: string;
    value: ProductCache;
    indexes: { 'by-cachedAt': number };
  };
  reference_data_cache: {
    key: string;
    value: ReferenceDataCache;
    indexes: { 'by-type': string };
  };
  user_cart_cache: {
    key: string;
    value: UserCartCache;
  };
  sync_queue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'by-status': SyncStatus; 'by-timestamp': number };
  };
  conflict_log: {
    key: number;
    value: ConflictLogEntry;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'gestion-stocks-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

/**
 * Initialise et retourne la connexion à la base de données IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, _transaction) {
      // Store 1: Metadata pour tracking expiration
      if (!db.objectStoreNames.contains('cache_metadata')) {
        db.createObjectStore('cache_metadata', { keyPath: 'key' });
      }

      // Store 2: Cache produits
      if (!db.objectStoreNames.contains('products_cache')) {
        const productStore = db.createObjectStore('products_cache', { keyPath: 'id' });
        productStore.createIndex('by-cachedAt', 'cachedAt');
      }

      // Store 3: Cache données de référence (catégories, unités, zones)
      if (!db.objectStoreNames.contains('reference_data_cache')) {
        const refStore = db.createObjectStore('reference_data_cache', { keyPath: 'id' });
        refStore.createIndex('by-type', 'type');
      }

      // Store 4: Cache panier utilisateur
      if (!db.objectStoreNames.contains('user_cart_cache')) {
        db.createObjectStore('user_cart_cache', { keyPath: 'userId' });
      }

      // Store 5: File d'attente de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        syncStore.createIndex('by-status', 'status');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Store 6: Log des résolutions de conflits
      if (!db.objectStoreNames.contains('conflict_log')) {
        const conflictStore = db.createObjectStore('conflict_log', {
          keyPath: 'id',
          autoIncrement: true
        });
        conflictStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

/**
 * Vide complètement le cache (utile pour debug ou déconnexion)
 */
export async function clearAllCache(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(
    ['cache_metadata', 'products_cache', 'reference_data_cache', 'user_cart_cache', 'sync_queue', 'conflict_log'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('cache_metadata').clear(),
    tx.objectStore('products_cache').clear(),
    tx.objectStore('reference_data_cache').clear(),
    tx.objectStore('user_cart_cache').clear(),
    tx.objectStore('sync_queue').clear(),
    tx.objectStore('conflict_log').clear(),
  ]);

  await tx.done;
}

/**
 * Récupère la taille estimée du cache IndexedDB
 */
export async function getCacheSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

// ========== CACHE METADATA ==========

export async function setCacheMetadata(key: string, expiresAt: number): Promise<void> {
  const db = await initDB();
  await db.put('cache_metadata', {
    key,
    lastUpdated: Date.now(),
    expiresAt,
  });
}

export async function getCacheMetadata(key: string): Promise<CacheMetadata | undefined> {
  const db = await initDB();
  return db.get('cache_metadata', key);
}

// ========== PRODUCTS CACHE ==========

export async function cacheProducts(products: any[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('products_cache', 'readwrite');
  const store = tx.objectStore('products_cache');

  const now = Date.now();
  await Promise.all(
    products.map(product =>
      store.put({
        id: product.id,
        data: product,
        cachedAt: now,
      })
    )
  );

  await tx.done;
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await initDB();
  const cachedProducts = await db.getAll('products_cache');
  return cachedProducts.map(cp => cp.data);
}

export async function getCachedProduct(id: string): Promise<any | undefined> {
  const db = await initDB();
  const cached = await db.get('products_cache', id);
  return cached?.data;
}

// ========== REFERENCE DATA CACHE ==========

export async function cacheReferenceData(
  type: 'category' | 'unit' | 'zone',
  data: any[]
): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('reference_data_cache', 'readwrite');
  const store = tx.objectStore('reference_data_cache');

  const now = Date.now();
  await Promise.all(
    data.map(item =>
      store.put({
        type,
        id: `${type}-${item.id}`,
        data: item,
        cachedAt: now,
      })
    )
  );

  await tx.done;
}

export async function getCachedReferenceData(
  type: 'category' | 'unit' | 'zone'
): Promise<any[]> {
  const db = await initDB();
  const index = db.transaction('reference_data_cache').store.index('by-type');
  const cached = await index.getAll(type);
  return cached.map(c => c.data);
}

// ========== USER CART CACHE ==========

export async function cacheUserCart(userId: string, items: any[]): Promise<void> {
  const db = await initDB();
  await db.put('user_cart_cache', {
    userId,
    items,
    lastSynced: Date.now(),
  });
}

export async function getCachedUserCart(userId: string): Promise<any[] | undefined> {
  const db = await initDB();
  const cached = await db.get('user_cart_cache', userId);
  return cached?.items;
}

// ========== SYNC QUEUE ==========

export async function addToSyncQueue(
  action: SyncActionType,
  payload: any
): Promise<number> {
  const db = await initDB();
  const id = await db.add('sync_queue', {
    action,
    payload,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  });
  return id as number;
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await initDB();
  const index = db.transaction('sync_queue').store.index('by-status');
  return index.getAll('pending');
}

export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  const db = await initDB();
  return db.getAll('sync_queue');
}

export async function updateSyncItem(
  id: number,
  updates: Partial<SyncQueueItem>
): Promise<void> {
  const db = await initDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    await db.put('sync_queue', { ...item, ...updates });
  }
}

export async function removeSyncItem(id: number): Promise<void> {
  const db = await initDB();
  await db.delete('sync_queue', id);
}

export async function clearCompletedSyncItems(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  const index = tx.store.index('by-status');
  const completed = await index.getAll('completed');

  await Promise.all(completed.map(item => tx.store.delete(item.id!)));
  await tx.done;
}

// ========== CONFLICT LOG ==========

export async function logConflict(
  action: SyncActionType,
  localData: any,
  remoteData: any,
  resolution: string
): Promise<void> {
  const db = await initDB();
  await db.add('conflict_log', {
    action,
    localData,
    remoteData,
    resolution,
    timestamp: Date.now(),
  });
}

export async function getConflictLog(limit = 50): Promise<ConflictLogEntry[]> {
  const db = await initDB();
  const all = await db.getAll('conflict_log');
  // Trier par timestamp décroissant et limiter
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}
