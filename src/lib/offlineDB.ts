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

export interface PhotoCache {
  productId: string;
  photo: string; // base64
  productUpdatedAt: number; // timestamp de mise à jour du produit
  cachedAt: number;
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
  photos_cache: {
    key: string;
    value: PhotoCache;
    indexes: { 'by-cachedAt': number };
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
const DB_VERSION = 2; // Incrémenté pour ajouter photos_cache

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

/**
 * Initialise et retourne la connexion à la base de données IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<OfflineDBSchema>) {
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

      // Store 5: Cache photos produits (pour réduire l'egress Supabase)
      if (!db.objectStoreNames.contains('photos_cache')) {
        const photosStore = db.createObjectStore('photos_cache', { keyPath: 'productId' });
        photosStore.createIndex('by-cachedAt', 'cachedAt');
      }

      // Store 6: File d'attente de synchronisation
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true
        });
        syncStore.createIndex('by-status', 'status');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Store 7: Log des résolutions de conflits
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
    ['cache_metadata', 'products_cache', 'reference_data_cache', 'user_cart_cache', 'photos_cache', 'sync_queue', 'conflict_log'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('cache_metadata').clear(),
    tx.objectStore('products_cache').clear(),
    tx.objectStore('reference_data_cache').clear(),
    tx.objectStore('user_cart_cache').clear(),
    tx.objectStore('photos_cache').clear(),
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
  return cachedProducts.map((cp: ProductCache) => cp.data);
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
  return cached.map((c: ReferenceDataCache) => c.data);
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

  await Promise.all(completed.map((item: SyncQueueItem) => tx.store.delete(item.id!)));
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
  return all.sort((a: ConflictLogEntry, b: ConflictLogEntry) => b.timestamp - a.timestamp).slice(0, limit);
}

// ========== PHOTOS CACHE ==========

/**
 * Cache une photo de produit
 */
export async function cacheProductPhoto(
  productId: string,
  photo: string,
  productUpdatedAt: number
): Promise<void> {
  const db = await initDB();
  await db.put('photos_cache', {
    productId,
    photo,
    productUpdatedAt,
    cachedAt: Date.now(),
  });
}

/**
 * Cache plusieurs photos en une seule transaction
 */
export async function cacheProductPhotos(
  photos: Array<{ productId: string; photo: string; productUpdatedAt: number }>
): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('photos_cache', 'readwrite');
  const store = tx.objectStore('photos_cache');
  const now = Date.now();

  await Promise.all(
    photos.map(p =>
      store.put({
        productId: p.productId,
        photo: p.photo,
        productUpdatedAt: p.productUpdatedAt,
        cachedAt: now,
      })
    )
  );

  await tx.done;
}

/**
 * Récupère une photo depuis le cache
 */
export async function getCachedPhoto(productId: string): Promise<string | undefined> {
  const db = await initDB();
  const cached = await db.get('photos_cache', productId);
  return cached?.photo;
}

/**
 * Récupère plusieurs photos depuis le cache
 */
export async function getCachedPhotos(productIds: string[]): Promise<Map<string, PhotoCache>> {
  const db = await initDB();
  const result = new Map<string, PhotoCache>();

  // Charger en parallèle pour de meilleures performances
  const promises = productIds.map(async (id) => {
    const cached = await db.get('photos_cache', id);
    if (cached) {
      result.set(id, cached);
    }
  });

  await Promise.all(promises);
  return result;
}

/**
 * Détermine quelles photos doivent être téléchargées depuis Supabase
 * Retourne les IDs des produits dont les photos ne sont pas en cache ou sont périmées
 */
export async function getPhotosToDownload(
  products: Array<{ id: string; updatedAt: Date }>
): Promise<string[]> {
  const db = await initDB();
  const toDownload: string[] = [];

  for (const product of products) {
    const cached = await db.get('photos_cache', product.id);

    if (!cached) {
      // Pas en cache, il faut télécharger
      toDownload.push(product.id);
    } else if (cached.productUpdatedAt < product.updatedAt.getTime()) {
      // Le produit a été mis à jour depuis le cache, il faut re-télécharger
      toDownload.push(product.id);
    }
    // Sinon, la photo en cache est valide
  }

  return toDownload;
}

/**
 * Supprime une photo du cache
 */
export async function removeCachedPhoto(productId: string): Promise<void> {
  const db = await initDB();
  await db.delete('photos_cache', productId);
}

/**
 * Nettoie les photos en cache pour les produits qui n'existent plus
 */
export async function cleanupOrphanedPhotos(validProductIds: Set<string>): Promise<number> {
  const db = await initDB();
  const tx = db.transaction('photos_cache', 'readwrite');
  const store = tx.objectStore('photos_cache');
  const allCached = await store.getAll();
  let removedCount = 0;

  for (const cached of allCached) {
    if (!validProductIds.has(cached.productId)) {
      await store.delete(cached.productId);
      removedCount++;
    }
  }

  await tx.done;
  return removedCount;
}

/**
 * Retourne des statistiques sur le cache photos
 */
export async function getPhotosCacheStats(): Promise<{
  count: number;
  oldestCachedAt: number | null;
  newestCachedAt: number | null;
}> {
  const db = await initDB();
  const all = await db.getAll('photos_cache');

  if (all.length === 0) {
    return { count: 0, oldestCachedAt: null, newestCachedAt: null };
  }

  const timestamps = all.map(p => p.cachedAt);
  return {
    count: all.length,
    oldestCachedAt: Math.min(...timestamps),
    newestCachedAt: Math.max(...timestamps),
  };
}
