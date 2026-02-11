import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Product, Category, Unit, StorageZone, ExitRequest, StockAlert, StockMovement, PendingExit, Order, CartItem } from '../types';
import * as offlineDB from '../lib/offlineDB';
import { getProductPhotoUrl, isStoragePath, isBase64Image, uploadProductPhoto } from '../lib/storageService';

interface AppContextType {
  // Auth
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithBadge: (badgeNumber: string) => Promise<boolean>;
  register: (username: string, name: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Users
  users: User[];
  updateUserRole: (userId: string, newRole: 'user' | 'manager') => Promise<void>;
  createUser: (username: string, name: string, password: string, role: 'user' | 'manager', badgeNumber?: string) => Promise<void>;
  updateUserBadge: (userId: string, badgeNumber: string | null) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>, skipMovement?: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getAllProductReferences: () => Promise<string[]>;
  reloadProducts: (forceRefresh?: boolean) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Units
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // Storage Zones
  storageZones: StorageZone[];
  addStorageZone: (zone: Omit<StorageZone, 'id'>) => Promise<void>;
  updateStorageZone: (id: string, zone: Omit<StorageZone, 'id'>) => Promise<void>;
  deleteStorageZone: (id: string) => Promise<void>;

  // Exit Requests
  exitRequests: ExitRequest[];
  addExitRequest: (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status' | 'requestedBy'>) => Promise<void>;
  updateExitRequest: (id: string, updates: Partial<ExitRequest>) => Promise<void>;
  deleteExitRequest: (id: string) => Promise<void>;

  // Stock Alerts
  getStockAlerts: () => StockAlert[];

  // Stock Movements
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => Promise<void>;

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'ordered_at' | 'ordered_by' | 'ordered_by_name' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  getPendingOrders: () => Order[];
  getAverageDeliveryTime: () => number;

  // Pending Exits (for printing)
  pendingExits: PendingExit[];
  getPendingExits: () => PendingExit[];
  addPendingExit: (exit: Omit<PendingExit, 'id' | 'addedAt'>) => Promise<void>;
  removePendingExit: (id: string) => Promise<void>;
  clearPendingExits: () => Promise<void>;

  // User Cart (panier synchronisé entre appareils)
  userCart: CartItem[];
  loadUserCart: () => Promise<void>;
  addToUserCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromUserCart: (productId: string) => Promise<void>;
  clearUserCart: () => Promise<void>;

  // Mode hors-ligne (utilisation du cache local)
  isOfflineMode: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [storageZones, setStorageZones] = useState<StorageZone[]>([]);
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingExits, setPendingExits] = useState<PendingExit[]>([]);
  const [userCart, setUserCart] = useState<CartItem[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Maps pour accès rapide O(1)
  const productsMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.id, p));
    return map;
  }, [products]);

  const categoriesMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.name, c));
    return map;
  }, [categories]);

  const unitsMap = useMemo(() => {
    const map = new Map<string, Unit>();
    units.forEach(u => map.set(u.abbreviation, u));
    return map;
  }, [units]);

  const storageZonesMap = useMemo(() => {
    const map = new Map<string, StorageZone>();
    storageZones.forEach(z => map.set(z.name, z));
    return map;
  }, [storageZones]);

  // Refs pour accéder aux données de référence dans les callbacks (évite les closures stale)
  const categoriesRef = useRef<Category[]>([]);
  const unitsRef = useRef<Unit[]>([]);
  const storageZonesRef = useRef<StorageZone[]>([]);

  // Mettre à jour les refs quand les états changent
  useEffect(() => { categoriesRef.current = categories; }, [categories]);
  useEffect(() => { unitsRef.current = units; }, [units]);
  useEffect(() => { storageZonesRef.current = storageZones; }, [storageZones]);

  // Vérifier l'utilisateur connecté
  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('id, username, role, name, badge_number')
          .eq('id', session.user.id)
          .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter l'erreur 406

        if (error) {
          console.error('Erreur lors de la récupération du profil:', error);
        }

        if (profile) {
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            password: '',
            role: profile.role,
            name: profile.name,
            badgeNumber: profile.badge_number || undefined,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger toutes les données - OPTIMISÉ pour réduire les connexions simultanées
  const loadAllData = useCallback(async (userId?: string) => {
    console.log('Début du chargement des données...', userId ? `pour userId: ${userId}` : '');

    // Timeout global de 15 secondes pour éviter le blocage infini
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout chargement données')), 15000)
    );

    const loadDataPromise = async () => {
      try {
        // ÉTAPE 1: Données de référence (petites tables, max 3 connexions)
        console.log('Chargement des données de référence...');
        await Promise.all([
          loadCategories().catch(err => console.warn('Erreur loadCategories:', err)),
          loadUnits().catch(err => console.warn('Erreur loadUnits:', err)),
          loadStorageZones().catch(err => console.warn('Erreur loadStorageZones:', err)),
        ]);

        // ÉTAPE 2: Données principales (max 2 connexions)
        console.log('Chargement des données principales...');
        await Promise.all([
          loadUsers().catch(err => console.warn('Erreur loadUsers:', err)),
          loadProducts().catch(err => console.warn('Erreur loadProducts:', err)),
        ]);

        // ÉTAPE 3: Données secondaires (max 3 connexions)
        console.log('Chargement des données secondaires...');
        await Promise.all([
          loadOrders().catch(err => console.warn('Erreur loadOrders:', err)),
          loadExitRequests().catch(err => console.warn('Erreur loadExitRequests:', err)),
          (userId ? loadUserCartForUser(userId) : loadUserCart()).catch(err => console.warn('Erreur loadUserCart:', err)),
        ]);

        // ÉTAPE 4: Historique (max 2 connexions, données volumineuses)
        console.log('Chargement de l\'historique...');
        await Promise.all([
          loadStockMovements().catch(err => console.warn('Erreur loadStockMovements:', err)),
          loadPendingExits().catch(err => console.warn('Erreur loadPendingExits:', err)),
        ]);

        console.log('Chargement des données terminé');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    try {
      await Promise.race([loadDataPromise(), timeoutPromise]);
    } catch (error) {
      console.warn('Timeout ou erreur lors du chargement des données:', error);
      // On continue quand même, les données se chargeront en arrière-plan
    }
  }, []);

  // Users - Optimisées
  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, name, role, badge_number')
      .order('name');

    if (!error && data) {
      setUsers(data.map(user => ({
        id: user.id,
        username: user.username,
        password: '',
        role: user.role,
        name: user.name,
        badgeNumber: user.badge_number || undefined,
      })));
    }
  }, []);

  const updateUserRole = useCallback(async (userId: string, newRole: 'user' | 'manager') => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // Update local immédiat
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    // Update currentUser si c'est lui
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }
  }, [currentUser]);

  const createUser = useCallback(async (username: string, name: string, password: string, role: 'user' | 'manager', badgeNumber?: string) => {
    try {
      // Vérifier si l'identifiant existe déjà
      const { data: existingUsername } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUsername) {
        throw new Error('Cet identifiant existe déjà');
      }

      // Vérifier si le badge existe déjà (seulement si fourni)
      if (badgeNumber) {
        const { data: existingBadge } = await supabase
          .from('user_profiles')
          .select('badge_number')
          .eq('badge_number', badgeNumber)
          .maybeSingle();

        if (existingBadge) {
          throw new Error('Ce numéro de badge est déjà utilisé');
        }
      }

      // Créer le compte auth
      // Si un badge est fourni, on l'utilise aussi comme mot de passe pour permettre la connexion par badge
      const email = `${username.toLowerCase()}@gestionstocks.app`;
      const authPassword = badgeNumber || password; // Utiliser le badge comme mot de passe si fourni

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: authPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            username,
            name,
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Erreur Auth Supabase:', authError);
        throw new Error(authError?.message || 'Erreur lors de la création du compte');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Créer le profil
      const profileToInsert = {
        id: authData.user.id,
        username,
        name,
        role,
        badge_number: badgeNumber || null,
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([profileToInsert])
        .select();

      if (profileError) {
        console.error('Erreur lors de la création du profil:', profileError);
        throw new Error('Erreur lors de la création du profil: ' + profileError.message);
      }

      // Recharger les utilisateurs pour garantir la synchronisation
      await loadUsers();
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }, [loadUsers]);

  const updateUserBadge = useCallback(async (userId: string, badgeNumber: string | null) => {
    // Vérifier si le badge est déjà utilisé par un autre utilisateur
    if (badgeNumber) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('badge_number', badgeNumber)
        .neq('id', userId)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Ce numéro de badge est déjà utilisé');
      }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ badge_number: badgeNumber })
      .eq('id', userId);

    if (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
      throw error;
    }

    // Mettre à jour le mot de passe Supabase Auth pour correspondre au badge
    // Cela permet la connexion par badge
    if (badgeNumber && currentUser?.id === userId) {
      try {
        await supabase.auth.updateUser({
          password: badgeNumber
        });
      } catch (err) {
        console.warn('Impossible de mettre à jour le mot de passe:', err);
      }
    }

    // Petit délai pour garantir que la transaction est terminée
    await new Promise(resolve => setTimeout(resolve, 100));

    // Recharger les utilisateurs pour garantir la synchronisation
    await loadUsers();

    // Update currentUser si c'est lui
    if (currentUser?.id === userId) {
      const updatedUser = await supabase
        .from('user_profiles')
        .select('id, username, role, name, badge_number')
        .eq('id', userId)
        .single();

      if (updatedUser.data) {
        setCurrentUser({
          id: updatedUser.data.id,
          username: updatedUser.data.username,
          password: '',
          role: updatedUser.data.role,
          name: updatedUser.data.name,
          badgeNumber: updatedUser.data.badge_number || undefined,
        });
      }
    }
  }, [currentUser, loadUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      // Ne pas permettre la suppression de soi-même
      if (currentUser?.id === userId) {
        throw new Error('Vous ne pouvez pas supprimer votre propre compte');
      }

      // Supprimer le profil (le compte auth sera supprimé via un trigger ou manuellement)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Update local immédiat
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }, [currentUser]);

  // Categories - Optimisées
  const loadCategories = useCallback(async () => {
    try {
      // Charger depuis le cache en premier (avec timeout pour éviter le blocage)
      try {
        const cachedCategories = await Promise.race([
          offlineDB.getCachedReferenceData('category'),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000))
        ]);
        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        }
      } catch (cacheError) {
        console.warn('Erreur cache catégories:', cacheError);
      }

      // Puis mettre à jour depuis Supabase
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .order('name');

      if (!error && data) {
        const categories = data.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || undefined,
        }));
        setCategories(categories);
        // Cache de manière non-bloquante
        offlineDB.cacheReferenceData('category', categories).catch(console.warn);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select('id, name, description')
      .single();

    if (!error && data) {
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
      };
      setCategories(prev => [...prev, newCategory]);
    } else {
      throw error;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, category: Omit<Category, 'id'>) => {
    const { error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id);

    if (!error) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));

      // Mettre à jour les produits qui utilisent cette catégorie
      const oldCategory = categories.find(c => c.id === id);
      if (oldCategory && oldCategory.name !== category.name) {
        // Mettre à jour directement via Supabase
        await supabase
          .from('products')
          .update({ category: category.name })
          .eq('category', oldCategory.name);

        // Mettre à jour l'état local
        setProducts(prev => prev.map(p =>
          p.category === oldCategory.name ? { ...p, category: category.name } : p
        ));
      }
    } else {
      throw error;
    }
  }, [categories, products]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      throw error;
    }
  }, []);

  // Units - Optimisées
  const loadUnits = useCallback(async () => {
    try {
      // Charger depuis le cache en premier (avec timeout pour éviter le blocage)
      try {
        const cachedUnits = await Promise.race([
          offlineDB.getCachedReferenceData('unit'),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000))
        ]);
        if (cachedUnits.length > 0) {
          setUnits(cachedUnits);
        }
      } catch (cacheError) {
        console.warn('Erreur cache unités:', cacheError);
      }

      // Puis mettre à jour depuis Supabase
      const { data, error } = await supabase
        .from('units')
        .select('id, name, abbreviation, is_default')
        .order('name');

      if (!error && data) {
        const units = data.map(unit => ({
          id: unit.id,
          name: unit.name,
          abbreviation: unit.abbreviation,
          isDefault: unit.is_default,
        }));
        setUnits(units);
        // Cache de manière non-bloquante
        offlineDB.cacheReferenceData('unit', units).catch(console.warn);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
    }
  }, []);

  const addUnit = useCallback(async (unit: Omit<Unit, 'id'>) => {
    const { data, error } = await supabase
      .from('units')
      .insert([{ ...unit, is_default: unit.isDefault }])
      .select('id, name, abbreviation, is_default')
      .single();

    if (!error && data) {
      const newUnit: Unit = {
        id: data.id,
        name: data.name,
        abbreviation: data.abbreviation,
        isDefault: data.is_default,
      };
      setUnits(prev => [...prev, newUnit]);
    } else {
      throw error;
    }
  }, []);

  const deleteUnit = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (!error) {
      setUnits(prev => prev.filter(u => u.id !== id));
    } else {
      throw error;
    }
  }, []);

  // Storage Zones - Optimisées
  const loadStorageZones = useCallback(async () => {
    try {
      // Charger depuis le cache en premier (avec timeout pour éviter le blocage)
      try {
        const cachedZones = await Promise.race([
          offlineDB.getCachedReferenceData('zone'),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000))
        ]);
        if (cachedZones.length > 0) {
          setStorageZones(cachedZones);
        }
      } catch (cacheError) {
        console.warn('Erreur cache zones:', cacheError);
      }

      // Puis mettre à jour depuis Supabase
      const { data, error } = await supabase
        .from('storage_zones')
        .select('id, name, description')
        .order('name');

      if (!error && data) {
        const zones = data.map(zone => ({
          id: zone.id,
          name: zone.name,
          description: zone.description || undefined,
        }));
        setStorageZones(zones);
        // Cache de manière non-bloquante
        offlineDB.cacheReferenceData('zone', zones).catch(console.warn);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des zones de stockage:', error);
    }
  }, []);

  const addStorageZone = useCallback(async (zone: Omit<StorageZone, 'id'>) => {
    const { data, error } = await supabase
      .from('storage_zones')
      .insert([zone])
      .select('id, name, description')
      .single();

    if (!error && data) {
      const newZone: StorageZone = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
      };
      setStorageZones(prev => [...prev, newZone]);
    } else {
      throw error;
    }
  }, []);

  const updateStorageZone = useCallback(async (id: string, zone: Omit<StorageZone, 'id'>) => {
    // Récupérer d'abord l'ancienne zone avant la mise à jour
    const { data: oldZoneData } = await supabase
      .from('storage_zones')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('storage_zones')
      .update(zone)
      .eq('id', id);

    if (!error) {
      setStorageZones(prev => prev.map(z => z.id === id ? { ...z, ...zone } : z));

      // Mettre à jour les produits qui utilisent cette zone
      if (oldZoneData && oldZoneData.name !== zone.name) {
        // Récupérer tous les produits qui utilisent l'ancienne zone
        const { data: productsToUpdate } = await supabase
          .from('products')
          .select('id, shelf, position')
          .eq('storage_zone', oldZoneData.name);

        if (productsToUpdate && productsToUpdate.length > 0) {
          // Mettre à jour chaque produit avec le nouveau nom de zone ET le location recalculé
          for (const prod of productsToUpdate) {
            const newLocation = `${zone.name}.${prod.shelf || ''}.${prod.position || ''}`;
            await supabase
              .from('products')
              .update({
                storage_zone: zone.name,
                location: newLocation
              })
              .eq('id', prod.id);
          }
        }

        // Mettre à jour l'état local avec les nouveaux storageZone ET location
        setProducts(prev => prev.map(p => {
          if (p.storageZone === oldZoneData.name) {
            const newLocation = `${zone.name}.${p.shelf || ''}.${p.position || ''}`;
            return {
              ...p,
              storageZone: zone.name,
              location: newLocation
            };
          }
          return p;
        }));
      }
    } else {
      throw error;
    }
  }, []);

  const deleteStorageZone = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('storage_zones')
      .delete()
      .eq('id', id);

    if (!error) {
      setStorageZones(prev => prev.filter(z => z.id !== id));
    } else {
      throw error;
    }
  }, []);

  // Products - Optimisées avec update local
  const loadProducts = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // 1. Charger depuis le cache uniquement si pas de force refresh (avec timeout)
      if (!forceRefresh) {
        try {
          const cachedProducts = await Promise.race([
            offlineDB.getCachedProducts(),
            new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000))
          ]);
          if (cachedProducts.length > 0) {
            setProducts(cachedProducts);
          }
        } catch (cacheError) {
          console.warn('Erreur cache produits:', cacheError);
        }
      }

      // 2. Utiliser les données de référence via les refs (chargées dans loadAllData)
      // Si pas encore chargées, les charger une seule fois
      let categoriesById: Map<string, string>;
      let unitsById: Map<string, string>;
      let zonesById: Map<string, string>;

      if (categoriesRef.current.length > 0 && unitsRef.current.length > 0) {
        // Utiliser les données déjà en mémoire via les refs
        categoriesById = new Map(categoriesRef.current.map(c => [c.id, c.name]));
        unitsById = new Map(unitsRef.current.map(u => [u.id, u.abbreviation]));
        zonesById = new Map(storageZonesRef.current.map(z => [z.id, z.name]));
        console.log('DEBUG: Utilisation des données de référence en cache');
      } else {
        // Charger depuis Supabase si pas encore en mémoire
        console.log('DEBUG: Chargement des données de référence depuis Supabase');
        const [categoriesRes, unitsRes, zonesRes] = await Promise.all([
          supabase.from('categories').select('id, name'),
          supabase.from('units').select('id, abbreviation'),
          supabase.from('storage_zones').select('id, name')
        ]);
        categoriesById = new Map((categoriesRes.data || []).map(c => [c.id, c.name]));
        unitsById = new Map((unitsRes.data || []).map(u => [u.id, u.abbreviation]));
        zonesById = new Map((zonesRes.data || []).map(z => [z.id, z.name]));
      }

      // NE PAS inclure 'photo' dans la requête principale pour éviter les timeouts
      // Les photos base64 sont trop lourdes et causent des erreurs 504
      // Les photos seront chargées séparément via loadProductPhotos()
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, reference, designation, category_id, storage_zone_id, shelf, position, location,
          current_stock, min_stock, unit_id, unit_price, packaging_type,
          order_link, order_link_1, supplier_1, order_link_2, supplier_2, order_link_3, supplier_3,
          deleted_at, created_at, updated_at
        `)
        .is('deleted_at', null)
        .order('reference');

      console.log('DEBUG: Résultat requête products:', {
        dataLength: data?.length,
        error: error,
        firstProduct: data?.[0]
      });

      // Vérifier si c'est une erreur de quota/limite Supabase
      const isQuotaError = error && (
        error.message?.includes('timeout') ||
        error.message?.includes('upstream request timeout') ||
        error.code === '429' ||
        error.code === '500' ||
        error.code === '503'
      );

      if (error) {
        console.error('DEBUG: Erreur Supabase products:', error);

        // Si erreur de quota, basculer en mode hors-ligne avec le cache
        if (isQuotaError) {
          console.warn('Limite Supabase atteinte, basculement en mode hors-ligne');
          setIsOfflineMode(true);

          // Utiliser le cache existant (déjà chargé au début de la fonction)
          // Les photos seront chargées depuis le cache local uniquement
          const cachedProductIds = products.map(p => p.id);
          if (cachedProductIds.length > 0) {
            loadProductPhotosInBatches(cachedProductIds);
          }
          return;
        }
      }

      if (!error && data) {
        console.log('DEBUG: Nombre de produits bruts reçus:', data.length);

        // Supabase fonctionne, désactiver le mode hors-ligne
        setIsOfflineMode(false);

        const products = data.map((p: any) => {
          return {
            id: p.id,
            reference: p.reference,
            designation: p.designation,
            category: categoriesById.get(p.category_id) || '',
            storageZone: p.storage_zone_id ? zonesById.get(p.storage_zone_id) : undefined,
            shelf: p.shelf || undefined,
            position: p.position || undefined,
            location: p.location,
            currentStock: p.current_stock,
            minStock: p.min_stock,
            unit: unitsById.get(p.unit_id) || '',
            unitPrice: p.unit_price || undefined,
            packagingType: p.packaging_type || 'unit',
            photo: undefined, // Les photos seront chargées séparément
            orderLink: p.order_link || undefined,
            orderLink1: p.order_link_1 || undefined,
            supplier1: p.supplier_1 || undefined,
            orderLink2: p.order_link_2 || undefined,
            supplier2: p.supplier_2 || undefined,
            orderLink3: p.order_link_3 || undefined,
            supplier3: p.supplier_3 || undefined,
            deletedAt: p.deleted_at ? new Date(p.deleted_at) : undefined,
            createdAt: new Date(p.created_at),
            updatedAt: new Date(p.updated_at),
          };
        });

        console.log('DEBUG: Nombre de produits après mapping:', products.length);

        // 3. Mettre à jour l'état avec les données fraîches de Supabase
        setProducts(products);

        // 4. Mettre à jour le cache pour la prochaine fois (non-bloquant)
        offlineDB.cacheProducts(products).catch(console.warn);

        // 5. Charger les photos en arrière-plan (non-bloquant, par lots)
        loadProductPhotosInBatches(data.map((p: any) => p.id));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);

      // Activer le mode hors-ligne
      setIsOfflineMode(true);

      // En cas d'erreur réseau, charger depuis le cache (avec timeout)
      try {
        const cachedProducts = await Promise.race([
          offlineDB.getCachedProducts(),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 1000))
        ]);
        if (cachedProducts.length > 0) {
          setProducts(cachedProducts);
          // Charger les photos depuis le cache local
          loadProductPhotosInBatches(cachedProducts.map((p: any) => p.id));
        }
      } catch (cacheError) {
        console.warn('Erreur cache produits (fallback):', cacheError);
      }
    }
  }, []);

  // Charger les photos par lots - d'abord depuis le cache local, puis depuis Supabase si nécessaire
  const loadProductPhotosInBatches = useCallback(async (productIds: string[]) => {
    const BATCH_SIZE = 10;

    // 1. D'abord essayer de charger toutes les photos depuis le cache local
    console.log('DEBUG: Chargement des photos depuis le cache local...');
    try {
      const cachedPhotos = await offlineDB.getCachedPhotos(productIds);

      if (cachedPhotos.size > 0) {
        console.log(`DEBUG: ${cachedPhotos.size} photos trouvées dans le cache local`);

        setProducts(prev => prev.map(product => {
          const cached = cachedPhotos.get(product.id);
          if (cached?.photo) {
            return { ...product, photo: cached.photo };
          }
          return product;
        }));
      }

      // Filtrer les IDs qui ne sont pas en cache
      const missingIds = productIds.filter(id => !cachedPhotos.has(id));
      console.log(`DEBUG: ${missingIds.length} photos manquantes à charger depuis Supabase`);

      if (missingIds.length === 0) {
        console.log('DEBUG: Toutes les photos sont en cache local');
        return;
      }

      // 2. Charger les photos manquantes depuis Supabase par lots
      const batches = [];
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        batches.push(missingIds.slice(i, i + BATCH_SIZE));
      }

      console.log(`DEBUG: Chargement de ${missingIds.length} photos en ${batches.length} lots`);

      const photosToCache: Array<{ productId: string; photo: string; productUpdatedAt: number }> = [];

      for (const batch of batches) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id, photo, updated_at')
            .in('id', batch)
            .not('photo', 'is', null);

          if (error) {
            console.warn('Erreur chargement photos batch:', error);
            // Si erreur de quota/timeout, on arrête et on garde le cache
            if (error.message?.includes('timeout') || error.code === '429') {
              console.warn('Limite Supabase atteinte, utilisation du cache uniquement');
              break;
            }
            continue;
          }

          if (data && data.length > 0) {
            // Mettre à jour les produits avec leurs photos
            setProducts(prev => {
              const photosMap = new Map<string, string>();
              data.forEach((p: any) => {
                if (p.photo) {
                  let photoUrl: string | null = null;
                  if (isStoragePath(p.photo)) {
                    photoUrl = getProductPhotoUrl(p.photo);
                  } else if (isBase64Image(p.photo)) {
                    photoUrl = p.photo;
                  }

                  if (photoUrl) {
                    photosMap.set(p.id, photoUrl);
                    // Préparer pour le cache
                    photosToCache.push({
                      productId: p.id,
                      photo: photoUrl,
                      productUpdatedAt: new Date(p.updated_at).getTime()
                    });
                  }
                }
              });

              return prev.map(product => {
                const photo = photosMap.get(product.id);
                if (photo) {
                  return { ...product, photo };
                }
                return product;
              });
            });
          }

          // Petit délai entre les lots pour ne pas surcharger
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.warn('Erreur chargement batch photos:', err);
        }
      }

      // 3. Cacher les nouvelles photos téléchargées
      if (photosToCache.length > 0) {
        console.log(`DEBUG: Mise en cache de ${photosToCache.length} nouvelles photos`);
        offlineDB.cacheProductPhotos(photosToCache).catch(console.warn);
      }
    } catch (cacheError) {
      console.warn('Erreur accès cache photos:', cacheError);
    }

    console.log('DEBUG: Chargement des photos terminé');
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const categoryId = categoriesMap.get(product.category)?.id;
    const unitId = unitsMap.get(product.unit)?.id;
    const zoneId = product.storageZone ? storageZonesMap.get(product.storageZone)?.id : null;

    if (!categoryId || !unitId) {
      throw new Error('Catégorie ou unité invalide');
    }

    // Créer d'abord le produit sans photo pour obtenir l'ID
    const { data, error } = await supabase
      .from('products')
      .insert([{
        reference: product.reference,
        designation: product.designation,
        category_id: categoryId,
        storage_zone_id: zoneId,
        shelf: product.shelf,
        position: product.position,
        location: product.location,
        current_stock: product.currentStock,
        min_stock: product.minStock,
        unit_id: unitId,
        unit_price: product.unitPrice,
        packaging_type: product.packagingType || 'unit',
        photo: null, // Photo ajoutée après via Storage
        order_link: product.orderLink,
        order_link_1: product.orderLink1,
        supplier_1: product.supplier1,
        order_link_2: product.orderLink2,
        supplier_2: product.supplier2,
        order_link_3: product.orderLink3,
        supplier_3: product.supplier3,
      }])
      .select(`
        id, reference, designation, current_stock, created_at, updated_at,
        category:categories(name),
        storage_zone:storage_zones(name),
        unit:units(abbreviation)
      `)
      .single();

    if (!error && data && currentUser) {
      const dataAny = data as any;
      let photoUrl: string | undefined = undefined;

      // Si une photo est fournie, l'uploader vers Storage
      if (product.photo && isBase64Image(product.photo)) {
        try {
          const storagePath = await uploadProductPhoto(dataAny.id, product.photo);
          if (storagePath) {
            // Mettre à jour le produit avec le chemin Storage
            await supabase
              .from('products')
              .update({ photo: storagePath })
              .eq('id', dataAny.id);

            // Convertir en URL pour l'affichage
            photoUrl = getProductPhotoUrl(storagePath) || undefined;
          }
        } catch (uploadError) {
          console.warn('Erreur upload photo vers Storage:', uploadError);
          // En cas d'échec, on continue sans photo
        }
      }

      // Créer le produit local
      const newProduct: Product = {
        ...product,
        id: dataAny.id,
        photo: photoUrl,
        category: Array.isArray(dataAny.category) ? (dataAny.category[0]?.name || product.category) : (dataAny.category?.name || product.category),
        storageZone: Array.isArray(dataAny.storage_zone) ? (dataAny.storage_zone[0]?.name || product.storageZone) : (dataAny.storage_zone?.name || product.storageZone),
        unit: Array.isArray(dataAny.unit) ? (dataAny.unit[0]?.abbreviation || product.unit) : (dataAny.unit?.abbreviation || product.unit),
        createdAt: new Date(dataAny.created_at),
        updatedAt: new Date(dataAny.updated_at),
      };

      // Update local immédiat
      setProducts(prev => [...prev, newProduct]);

      // Ajouter mouvement de stock en background
      addStockMovement({
        productId: data.id,
        productReference: data.reference,
        productDesignation: data.designation,
        movementType: 'initial',
        quantity: data.current_stock,
        previousStock: 0,
        newStock: data.current_stock,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: 'Création du produit',
      });
    } else {
      throw error;
    }
  }, [categoriesMap, unitsMap, storageZonesMap, currentUser]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>, skipMovement: boolean = false) => {
    const product = productsMap.get(id);
    if (!product) {
      console.error('❌ updateProduct: Produit introuvable:', id);
      return;
    }

    // Optimisation: logs désactivés en production pour améliorer les performances

    const updateData: any = {};

    if (updates.designation !== undefined) updateData.designation = updates.designation;
    if (updates.category !== undefined) {
      const categoryId = categoriesMap.get(updates.category)?.id;
      if (categoryId) updateData.category_id = categoryId;
    }
    if (updates.packagingType !== undefined) updateData.packaging_type = updates.packagingType;
    if (updates.storageZone !== undefined) {
      const zoneId = storageZonesMap.get(updates.storageZone)?.id;
      if (zoneId) updateData.storage_zone_id = zoneId;
    }
    if (updates.shelf !== undefined) updateData.shelf = updates.shelf;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.unit !== undefined) {
      const unitId = unitsMap.get(updates.unit)?.id;
      if (unitId) updateData.unit_id = unitId;
    }

    // Gestion spéciale pour les photos: uploader vers Storage
    let newPhotoUrl: string | undefined = undefined;
    if (updates.photo !== undefined) {
      if (updates.photo && isBase64Image(updates.photo)) {
        // Nouvelle photo en base64 -> uploader vers Storage
        try {
          const storagePath = await uploadProductPhoto(id, updates.photo);
          if (storagePath) {
            updateData.photo = storagePath;
            newPhotoUrl = getProductPhotoUrl(storagePath) || undefined;
          }
        } catch (uploadError) {
          console.warn('Erreur upload photo vers Storage:', uploadError);
        }
      } else if (updates.photo === null || updates.photo === '') {
        // Suppression de la photo
        updateData.photo = null;
      }
      // Si c'est déjà une URL ou un chemin Storage, on ne fait rien
    }

    if (updates.orderLink !== undefined) updateData.order_link = updates.orderLink;
    if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
    if (updates.supplier1 !== undefined) updateData.supplier_1 = updates.supplier1;
    if (updates.orderLink1 !== undefined) updateData.order_link_1 = updates.orderLink1;
    if (updates.supplier2 !== undefined) updateData.supplier_2 = updates.supplier2;
    if (updates.orderLink2 !== undefined) updateData.order_link_2 = updates.orderLink2;
    if (updates.supplier3 !== undefined) updateData.supplier_3 = updates.supplier3;
    if (updates.orderLink3 !== undefined) updateData.order_link_3 = updates.orderLink3;

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour produit:', error);
      throw error;
    }

    // Mise à jour locale optimiste avec les données qu'on a envoyées
    // IMPORTANT: Filtrer les valeurs undefined pour ne pas écraser les données existantes
    setProducts(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        if (p.id === id) {
          // Filtrer les propriétés undefined pour ne pas écraser les valeurs existantes
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          );

          // Si une nouvelle photo a été uploadée vers Storage, utiliser l'URL
          if (newPhotoUrl) {
            cleanUpdates.photo = newPhotoUrl;
          }

          // Créer l'objet mis à jour avec nos updates (sans undefined)
          return {
            ...p,
            ...cleanUpdates,
            updatedAt: new Date()
          };
        }
        return p;
      });
      return updatedProducts;
    });

    // Enregistrer mouvement de stock si changement de stock (sauf si skipMovement est true)
    if (!skipMovement && updates.currentStock !== undefined && updates.currentStock !== product.currentStock && currentUser) {
      const quantity = updates.currentStock - product.currentStock;
      addStockMovement({
        productId: product.id,
        productReference: product.reference,
        productDesignation: product.designation,
        movementType: quantity > 0 ? 'entry' : quantity < 0 ? 'exit' : 'adjustment',
        quantity: Math.abs(quantity),
        previousStock: product.currentStock,
        newStock: updates.currentStock,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: 'Ajustement manuel du stock',
      });
    }
  }, [productsMap, categoriesMap, unitsMap, storageZonesMap, currentUser]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      throw error;
    }
  }, []);

  const getProductById = useCallback((id: string) => {
    return productsMap.get(id);
  }, [productsMap]);

  const getAllProductReferences = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('reference');

    if (error || !data) {
      console.error('Erreur lors de la récupération des références:', error);
      return [];
    }

    return data.map(p => p.reference);
  }, []);

  // Exit Requests - Optimisées
  const loadExitRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('exit_requests')
      .select('*')
      .order('requested_at', { ascending: false })
      .limit(500); // Limiter pour performance

    if (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      return;
    }

    if (data) {
      // Charger profils en une seule requête
      const userIds = [...new Set([
        ...data.map(r => r.requested_by).filter(Boolean),
        ...data.map(r => r.approved_by).filter(Boolean)
      ])];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

      setExitRequests(data.map(r => ({
        id: r.id,
        productId: r.product_id,
        productReference: r.product_reference,
        productDesignation: r.product_designation,
        productPhoto: r.product_photo,
        quantity: r.quantity,
        requestedBy: profileMap.get(r.requested_by) || r.requested_by,
        requestedAt: new Date(r.requested_at),
        status: r.status as 'pending' | 'awaiting_reception' | 'approved' | 'rejected',
        approvedBy: r.approved_by ? (profileMap.get(r.approved_by) || r.approved_by) : undefined,
        approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
        receivedAt: r.received_at ? new Date(r.received_at) : undefined,
        reason: r.reason || undefined,
        notes: r.notes || undefined,
      })));
    }
  }, []);

  const addExitRequest = useCallback(async (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status' | 'requestedBy'>) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('exit_requests')
      .insert([{
        product_id: request.productId,
        product_reference: request.productReference,
        product_designation: request.productDesignation,
        product_photo: request.productPhoto,
        quantity: request.quantity,
        requested_by: currentUser.id,
        reason: request.reason,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de la demande:', error);
      throw error;
    }

    // Update local immédiat
    const newRequest: ExitRequest = {
      id: data.id,
      productId: data.product_id,
      productReference: data.product_reference,
      productDesignation: data.product_designation,
      productPhoto: data.product_photo,
      quantity: data.quantity,
      requestedBy: currentUser.username,
      requestedAt: new Date(data.requested_at),
      status: data.status,
      reason: data.reason,
    };

    setExitRequests(prev => [newRequest, ...prev]);
  }, [currentUser]);

  const updateExitRequest = useCallback(async (id: string, updates: Partial<ExitRequest>) => {
    const request = exitRequests.find(r => r.id === id);
    if (!request) {
      throw new Error('Demande introuvable');
    }

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.approvedBy) updateData.approved_by = updates.approvedBy;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.receivedAt) updateData.received_at = updates.receivedAt.toISOString();

    if (updates.status === 'awaiting_reception' || updates.status === 'rejected') {
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('exit_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Update local immédiat
    setExitRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

    // Si approuvée, mettre à jour le stock
    if (updates.status === 'approved' && currentUser) {
      const product = productsMap.get(request.productId);
      if (product) {
        // Vérifier si c'est une demande d'écart (quantité = nouveau stock) ou une sortie normale (quantité = à soustraire)
        const isDiscrepancy = request.reason?.startsWith('Écart de stock signalé');
        const newStock = isDiscrepancy ? request.quantity : product.currentStock - request.quantity;
        const quantityChanged = Math.abs(newStock - product.currentStock);

        await updateProduct(product.id, { currentStock: newStock }, true);

        await addStockMovement({
          productId: product.id,
          productReference: product.reference,
          productDesignation: product.designation,
          movementType: isDiscrepancy ? 'adjustment' : 'exit',
          quantity: quantityChanged,
          previousStock: product.currentStock,
          newStock: newStock,
          userId: currentUser.id,
          userName: currentUser.name,
          reason: isDiscrepancy ? request.reason || 'Ajustement suite à écart de stock' : `Sortie de stock - ${request.reason || 'Demande approuvée'}`,
          notes: request.notes,
        });

        addPendingExit({
          productReference: product.reference,
          productDesignation: product.designation,
          storageZone: product.storageZone,
          shelf: product.shelf,
          position: product.position,
          quantity: request.quantity,
          requestedBy: request.requestedBy,
        });
      }
    }
  }, [exitRequests, productsMap, currentUser, updateProduct]);

  const deleteExitRequest = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('exit_requests')
      .delete()
      .eq('id', id);

    if (!error) {
      setExitRequests(prev => prev.filter(r => r.id !== id));
    } else {
      throw error;
    }
  }, []);

  // Stock Movements - Optimisées
  const loadStockMovements = useCallback(async () => {
    try {
      // Charger uniquement les 30 derniers jours pour performance
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(500); // Limiter pour performance

      if (!error && data) {
        setStockMovements(data.map(m => ({
          id: m.id,
          productId: m.product_id,
          productReference: m.product_reference,
          productDesignation: m.product_designation,
          movementType: m.movement_type as 'entry' | 'exit' | 'adjustment' | 'initial',
          quantity: m.quantity,
          previousStock: m.previous_stock,
          newStock: m.new_stock,
          userId: m.user_id,
          userName: m.user_name,
          reason: m.reason,
          notes: m.notes || undefined,
          timestamp: new Date(m.timestamp),
        })));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements de stock:', error);
    }
  }, []);

  const addStockMovement = useCallback(async (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: movement.productId,
        product_reference: movement.productReference,
        product_designation: movement.productDesignation,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        previous_stock: movement.previousStock,
        new_stock: movement.newStock,
        user_id: movement.userId,
        user_name: movement.userName,
        reason: movement.reason,
        notes: movement.notes,
      }])
      .select()
      .single();

    if (!error && data) {
      const newMovement: StockMovement = {
        id: data.id,
        productId: data.product_id,
        productReference: data.product_reference,
        productDesignation: data.product_designation,
        movementType: data.movement_type,
        quantity: data.quantity,
        previousStock: data.previous_stock,
        newStock: data.new_stock,
        userId: data.user_id,
        userName: data.user_name,
        reason: data.reason,
        notes: data.notes,
        timestamp: new Date(data.timestamp),
      };

      // Update local - ajouter en début de liste
      setStockMovements(prev => [newMovement, ...prev.slice(0, 499)]);
    }
  }, []);

  // Orders - Optimisées
  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('ordered_at', { ascending: false })
      .limit(200); // Limiter pour performance

    if (!error && data) {
      setOrders(data.map(o => ({
        id: o.id,
        product_id: o.product_id,
        product_reference: o.product_reference,
        product_designation: o.product_designation,
        quantity: o.quantity,
        ordered_by: o.ordered_by,
        ordered_by_name: o.ordered_by_name,
        ordered_at: new Date(o.ordered_at),
        received_at: o.received_at ? new Date(o.received_at) : undefined,
        status: o.status as 'pending' | 'received' | 'cancelled',
        notes: o.notes || undefined,
        created_at: new Date(o.created_at),
        updated_at: new Date(o.updated_at),
      })));
    }
  }, []);

  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'ordered_at' | 'ordered_by' | 'ordered_by_name' | 'status' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        product_id: order.product_id,
        product_reference: order.product_reference,
        product_designation: order.product_designation,
        quantity: order.quantity,
        ordered_by: currentUser.id,
        ordered_by_name: currentUser.name,
        status: 'pending',
        notes: order.notes,
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      const newOrder: Order = {
        id: data.id,
        product_id: data.product_id,
        product_reference: data.product_reference,
        product_designation: data.product_designation,
        quantity: data.quantity,
        ordered_by: data.ordered_by,
        ordered_by_name: data.ordered_by_name,
        ordered_at: new Date(data.ordered_at),
        status: data.status,
        notes: data.notes,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };

      setOrders(prev => [newOrder, ...prev]);
    }
  }, [currentUser]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.received_at !== undefined) updateData.received_at = updates.received_at;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Update local immédiat
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates, updated_at: new Date() } : o));
  }, []);

  const getPendingOrders = useCallback((): Order[] => {
    return orders.filter(o => o.status === 'pending');
  }, [orders]);

  const getAverageDeliveryTime = useCallback((): number => {
    const receivedOrders = orders.filter(o => o.status === 'received' && o.received_at);

    if (receivedOrders.length === 0) return 0;

    const totalTime = receivedOrders.reduce((sum, order) => {
      const orderTime = new Date(order.ordered_at).getTime();
      const receiveTime = new Date(order.received_at!).getTime();
      const diffDays = (receiveTime - orderTime) / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return Math.round(totalTime / receivedOrders.length * 10) / 10;
  }, [orders]);

  // Stock Alerts - Mémoïsée
  const getStockAlerts = useCallback((): StockAlert[] => {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      if (product.currentStock <= product.minStock) {
        const percentage = product.minStock > 0 ? (product.currentStock / product.minStock) * 100 : 0;
        alerts.push({
          product,
          alertType: product.currentStock === 0 ? 'critical' : 'low',
          percentage: Math.round(percentage)
        });
      }
    });

    return alerts.sort((a, b) => a.percentage - b.percentage);
  }, [products]);

  // Pending Exits - Utilise Supabase pour persistance après déconnexion
  const loadPendingExits = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('pending_exits')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('added_at', { ascending: true });

      if (error) throw error;

      const exits: PendingExit[] = (data || []).map(row => ({
        id: row.id,
        productReference: row.product_reference,
        productDesignation: row.product_designation,
        storageZone: row.storage_zone,
        shelf: row.shelf,
        position: row.position,
        quantity: row.quantity,
        requestedBy: row.requested_by,
        addedAt: new Date(row.added_at),
      }));

      setPendingExits(exits);
    } catch (error) {
      console.error('Erreur lors du chargement des sorties en attente:', error);
      setPendingExits([]);
    }
  }, [currentUser]);

  const getPendingExits = useCallback((): PendingExit[] => {
    return pendingExits;
  }, [pendingExits]);

  const addPendingExit = useCallback(async (exit: Omit<PendingExit, 'id' | 'addedAt'>) => {
    if (!currentUser) {
      console.error('Utilisateur non connecté');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pending_exits')
        .insert({
          user_id: currentUser.id,
          product_reference: exit.productReference,
          product_designation: exit.productDesignation,
          storage_zone: exit.storageZone,
          shelf: exit.shelf,
          position: exit.position,
          quantity: exit.quantity,
          requested_by: exit.requestedBy,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter à l'état local
      const newExit: PendingExit = {
        id: data.id,
        productReference: data.product_reference,
        productDesignation: data.product_designation,
        storageZone: data.storage_zone,
        shelf: data.shelf,
        position: data.position,
        quantity: data.quantity,
        requestedBy: data.requested_by,
        addedAt: new Date(data.added_at),
      };

      setPendingExits(prev => [...prev, newExit]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la sortie en attente:', error);
      throw error;
    }
  }, [currentUser]);

  const removePendingExit = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('pending_exits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Supprimer de l'état local
      setPendingExits(prev => prev.filter(exit => exit.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la sortie en attente:', error);
      throw error;
    }
  }, []);

  const clearPendingExits = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('pending_exits')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setPendingExits([]);
    } catch (error) {
      console.error('Erreur lors de la suppression des sorties en attente:', error);
      throw error;
    }
  }, [currentUser]);

  // User Cart - Panier synchronisé entre appareils via Supabase
  const loadUserCart = useCallback(async () => {
    if (!currentUser) {
      setUserCart([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_cart')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('added_at', { ascending: true });

      if (error) throw error;

      const cart: CartItem[] = (data || []).map(row => ({
        productId: row.product_id,
        productReference: row.product_reference,
        productDesignation: row.product_designation,
        quantity: row.quantity,
        photo: row.photo,
        storageZone: row.storage_zone,
        shelf: row.shelf,
        position: row.position,
        unit: row.unit,
      }));

      setUserCart(cart);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      setUserCart([]);
    }
  }, [currentUser]);

  // Charger le panier pour un userId spécifique (utilisé lors de la connexion)
  const loadUserCartForUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_cart')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: true });

      if (error) throw error;

      const cart: CartItem[] = (data || []).map(row => ({
        productId: row.product_id,
        productReference: row.product_reference,
        productDesignation: row.product_designation,
        quantity: row.quantity,
        photo: row.photo,
        storageZone: row.storage_zone,
        shelf: row.shelf,
        position: row.position,
        unit: row.unit,
      }));

      setUserCart(cart);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      setUserCart([]);
    }
  }, []);

  const addToUserCart = useCallback(async (item: Omit<CartItem, 'id'>) => {
    if (!currentUser) {
      console.error('Utilisateur non connecté');
      return;
    }

    try {
      // Vérifier si le produit existe déjà dans le panier
      const existing = userCart.find(cartItem => cartItem.productId === item.productId);

      if (existing) {
        // Mise à jour optimiste de l'UI
        const newQuantity = existing.quantity + item.quantity;
        setUserCart(prev => prev.map(cartItem =>
          cartItem.productId === item.productId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        ));

        // Puis mettre à jour en base de données
        try {
          const { error } = await supabase
            .from('user_cart')
            .update({ quantity: newQuantity })
            .eq('user_id', currentUser.id)
            .eq('product_id', item.productId);

          if (error) throw error;
        } catch (error) {
          // En cas d'erreur, revenir à l'état précédent
          setUserCart(prev => prev.map(cartItem =>
            cartItem.productId === item.productId
              ? { ...cartItem, quantity: existing.quantity }
              : cartItem
          ));
          throw error;
        }
      } else {
        // Mise à jour optimiste de l'UI - ajouter immédiatement
        const optimisticItem: CartItem = {
          productId: item.productId,
          productReference: item.productReference,
          productDesignation: item.productDesignation,
          quantity: item.quantity,
          photo: item.photo,
          storageZone: item.storageZone,
          shelf: item.shelf,
          position: item.position,
          unit: item.unit,
        };
        setUserCart(prev => [...prev, optimisticItem]);

        // Puis insérer en base de données
        try {
          const { error } = await supabase
            .from('user_cart')
            .insert({
              user_id: currentUser.id,
              product_id: item.productId,
              product_reference: item.productReference,
              product_designation: item.productDesignation,
              quantity: item.quantity,
              photo: item.photo,
              storage_zone: item.storageZone,
              shelf: item.shelf,
              position: item.position,
              unit: item.unit,
            });

          if (error) throw error;
        } catch (error) {
          // En cas d'erreur, retirer l'article optimiste
          setUserCart(prev => prev.filter(cartItem => cartItem.productId !== item.productId));
          throw error;
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      throw error;
    }
  }, [currentUser, userCart]);

  const updateCartItem = useCallback(async (productId: string, quantity: number) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_cart')
        .update({ quantity })
        .eq('user_id', currentUser.id)
        .eq('product_id', productId);

      if (error) throw error;

      setUserCart(prev => prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du panier:', error);
      throw error;
    }
  }, [currentUser]);

  const removeFromUserCart = useCallback(async (productId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_cart')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('product_id', productId);

      if (error) throw error;

      setUserCart(prev => prev.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error);
      throw error;
    }
  }, [currentUser]);

  const clearUserCart = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_cart')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setUserCart([]);
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error);
      throw error;
    }
  }, [currentUser]);

  // Fonctions utilitaires pour le cache de session (mode hors-ligne)
  const CACHED_SESSION_KEY = 'stockpro_cached_session';

  const saveCachedSession = (user: User) => {
    try {
      localStorage.setItem(CACHED_SESSION_KEY, JSON.stringify({
        user,
        timestamp: Date.now(),
      }));
    } catch (e) {
      console.warn('Erreur sauvegarde session cache:', e);
    }
  };

  const getCachedSession = (): User | null => {
    try {
      const cached = localStorage.getItem(CACHED_SESSION_KEY);
      if (!cached) return null;

      const { user, timestamp } = JSON.parse(cached);
      // Session valide pendant 30 jours
      const maxAge = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(CACHED_SESSION_KEY);
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  };

  const clearCachedSession = () => {
    try {
      localStorage.removeItem(CACHED_SESSION_KEY);
    } catch (e) {
      console.warn('Erreur suppression session cache:', e);
    }
  };

  // Vérifier si une erreur est liée au quota/réseau
  const isNetworkOrQuotaError = (error: any): boolean => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toString() || '';
    return (
      message.includes('cors') ||
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('timeout') ||
      message.includes('quota') ||
      code === '429' ||
      code === '500' ||
      code === '503'
    );
  };

  // Auth - Optimisées
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Timeout de 10 secondes pour la recherche du profil
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 10000)
      );

      const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

      // Si erreur réseau/quota, essayer la session en cache
      if (profileError && isNetworkOrQuotaError(profileError)) {
        console.warn('Erreur réseau/quota, tentative avec session en cache...');
        const cachedUser = getCachedSession();
        if (cachedUser && cachedUser.username === username) {
          console.log('Connexion via session en cache (mode hors-ligne)');
          setCurrentUser(cachedUser);
          setIsOfflineMode(true);
          // Charger les données depuis le cache
          loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData:', err));
          return true;
        }
        return false;
      }

      if (!profile) {
        return false;
      }

      const email = `${username.toLowerCase()}@gestionstocks.app`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return false;
      }

      // Créer l'objet utilisateur
      const user: User = {
        id: profile.id,
        username: profile.username,
        password: '',
        role: profile.role,
        name: profile.name,
        badgeNumber: profile.badge_number || undefined,
      };

      // Charger le profil et les données
      setCurrentUser(user);

      // Sauvegarder la session pour le mode hors-ligne
      saveCachedSession(user);

      // Charger les données en arrière-plan (ne pas bloquer)
      loadAllData(profile.id).catch(err => console.warn('Erreur loadAllData:', err));
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);

      // En cas d'erreur réseau, essayer la session en cache
      if (isNetworkOrQuotaError(error)) {
        const cachedUser = getCachedSession();
        if (cachedUser && cachedUser.username === username) {
          console.log('Connexion via session en cache après erreur (mode hors-ligne)');
          setCurrentUser(cachedUser);
          setIsOfflineMode(true);
          loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData:', err));
          return true;
        }
      }

      return false;
    }
  }, [loadAllData]);

  const loginWithBadge = useCallback(async (badgeNumber: string): Promise<boolean> => {
    try {
      // Timeout de 10 secondes pour la recherche du badge
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('badge_number', badgeNumber)
        .single();

      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 10000)
      );

      const { data: profile, error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

      // Si erreur réseau/quota, essayer la session en cache
      if (profileError && isNetworkOrQuotaError(profileError)) {
        console.warn('Erreur réseau/quota badge, tentative avec session en cache...');
        const cachedUser = getCachedSession();
        if (cachedUser && cachedUser.badgeNumber === badgeNumber) {
          console.log('Connexion badge via session en cache (mode hors-ligne)');
          setCurrentUser(cachedUser);
          setIsOfflineMode(true);
          loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData:', err));
          return true;
        }
        return false;
      }

      if (!profile) {
        return false;
      }

      // Authentifier l'utilisateur via Supabase Auth pour créer une session persistante
      // On utilise le badge number comme mot de passe
      const email = `${profile.username.toLowerCase()}@gestionstocks.app`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: badgeNumber, // Le badge number est utilisé comme mot de passe
      });

      if (authError || !authData.user) {
        console.error('Erreur auth badge:', authError);
        return false;
      }

      // Créer l'objet utilisateur
      const user: User = {
        id: profile.id,
        username: profile.username,
        password: '',
        role: profile.role,
        name: profile.name,
        badgeNumber: profile.badge_number || undefined,
      };

      // Charger le profil et les données
      setCurrentUser(user);

      // Sauvegarder la session pour le mode hors-ligne
      saveCachedSession(user);

      // Charger les données en arrière-plan (ne pas bloquer)
      loadAllData(profile.id).catch(err => console.warn('Erreur loadAllData:', err));
      return true;
    } catch (error) {
      console.error('Erreur de connexion par badge:', error);

      // En cas d'erreur réseau, essayer la session en cache
      if (isNetworkOrQuotaError(error)) {
        const cachedUser = getCachedSession();
        if (cachedUser && cachedUser.badgeNumber === badgeNumber) {
          console.log('Connexion badge via session en cache après erreur (mode hors-ligne)');
          setCurrentUser(cachedUser);
          setIsOfflineMode(true);
          loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData:', err));
          return true;
        }
      }

      return false;
    }
  }, [loadAllData]);

  const register = useCallback(async (username: string, name: string, password: string): Promise<boolean> => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingProfile) {
        console.error('Cet identifiant existe déjà');
        return false;
      }

      const email = `${username.toLowerCase()}@gestionstocks.app`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            username,
            name,
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Erreur lors de la création du compte:', authError);
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          username,
          name,
          role: 'user',
        }]);

      if (profileError) {
        console.error('Erreur lors de la création du profil:', profileError);
        return false;
      }

      if (authData.session) {
        setCurrentUser({
          id: authData.user.id,
          username,
          password: '',
          role: 'user',
          name,
        });

        await loadAllData();
      } else {
        await login(username, password);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return false;
    }
  }, [loadAllData, login]);

  const logout = useCallback(async () => {
    // Vider le panier en base AVANT de supprimer currentUser (clearUserCart en a besoin)
    try {
      await clearUserCart();
    } catch (e) {
      console.warn('Erreur vidage panier (ignorée):', e);
    }

    // Effacer la session en cache
    clearCachedSession();
    // Désactiver le mode hors-ligne
    setIsOfflineMode(false);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Erreur signOut (ignorée):', e);
    }

    setCurrentUser(null);
    setProducts([]);
    setExitRequests([]);
    setStockMovements([]);
    setOrders([]);
    setPendingExits([]);
    setUserCart([]);
  }, [clearUserCart]);

  // Écouter les changements d'authentification et restaurer la session au rafraîchissement
  useEffect(() => {
    let mounted = true;

    // Vérifier et restaurer la session au démarrage
    const initSession = async () => {
      try {
        // Timeout de 5 secondes pour éviter le blocage infini
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }; error?: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: { message: 'timeout' } }), 5000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const session = result.data?.session;
        const sessionError = (result as any).error;

        if (!mounted) return;

        if (session?.user) {
          // Il y a une session existante, restaurer l'utilisateur
          await checkUser();
          await loadAllData(session.user.id);
        } else if (sessionError || !session) {
          // Pas de session Supabase ou erreur - essayer le cache local
          const cachedUser = getCachedSession();
          if (cachedUser) {
            console.log('Restauration session depuis le cache local (mode hors-ligne)');
            setCurrentUser(cachedUser);
            setIsOfflineMode(true);
            loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData cache:', err));
          } else {
            // Pas de session, afficher la page de connexion
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur initSession:', error);

        // En cas d'erreur réseau, essayer le cache
        if (mounted) {
          const cachedUser = getCachedSession();
          if (cachedUser) {
            console.log('Restauration session cache après erreur (mode hors-ligne)');
            setCurrentUser(cachedUser);
            setIsOfflineMode(true);
            loadAllData(cachedUser.id).catch(err => console.warn('Erreur loadAllData:', err));
          } else {
            setLoading(false);
          }
        }
      }
    };

    initSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {

      if (!mounted) return;

      // IMPORTANT : On ignore SIGNED_IN et INITIAL_SESSION car ils sont déjà gérés
      // - INITIAL_SESSION est géré par initSession() ci-dessus
      // - SIGNED_IN est géré par les fonctions login() et loginWithBadge()

      if (event === 'SIGNED_OUT') {
        // Utilisateur déconnecté
        setCurrentUser(null);
        setLoading(false);
      }

      // TOKEN_REFRESHED : rien à faire, la session est automatiquement mise à jour
    });

    // Nettoyage
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Mémoïser la valeur du contexte pour éviter re-renders inutiles
  const value = useMemo<AppContextType>(() => ({
    currentUser,
    loading,
    login,
    loginWithBadge,
    register,
    logout,
    users,
    updateUserRole,
    createUser,
    updateUserBadge,
    deleteUser,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getAllProductReferences,
    reloadProducts: loadProducts,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    units,
    addUnit,
    deleteUnit,
    storageZones,
    addStorageZone,
    updateStorageZone,
    deleteStorageZone,
    exitRequests,
    addExitRequest,
    updateExitRequest,
    deleteExitRequest,
    getStockAlerts,
    stockMovements,
    addStockMovement,
    orders,
    addOrder,
    updateOrder,
    getPendingOrders,
    getAverageDeliveryTime,
    pendingExits,
    getPendingExits,
    addPendingExit,
    removePendingExit,
    clearPendingExits,
    userCart,
    loadUserCart,
    addToUserCart,
    updateCartItem,
    removeFromUserCart,
    clearUserCart,
    isOfflineMode,
  }), [
    currentUser,
    loading,
    login,
    loginWithBadge,
    register,
    logout,
    users,
    updateUserRole,
    createUser,
    updateUserBadge,
    deleteUser,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getAllProductReferences,
    loadProducts,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    units,
    addUnit,
    deleteUnit,
    storageZones,
    addStorageZone,
    updateStorageZone,
    deleteStorageZone,
    exitRequests,
    addExitRequest,
    updateExitRequest,
    deleteExitRequest,
    getStockAlerts,
    stockMovements,
    addStockMovement,
    orders,
    addOrder,
    updateOrder,
    getPendingOrders,
    getAverageDeliveryTime,
    pendingExits,
    getPendingExits,
    addPendingExit,
    removePendingExit,
    clearPendingExits,
    userCart,
    loadUserCart,
    addToUserCart,
    updateCartItem,
    removeFromUserCart,
    clearUserCart,
    isOfflineMode,
  ]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-color)',
        color: 'var(--text-color)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Chargement...</div>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
