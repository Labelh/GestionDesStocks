import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Product, Category, Unit, StorageZone, ExitRequest, StockAlert, StockMovement, PendingExit, Order, CartItem } from '../types';

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
  updateUserProfile: (updates: Partial<Pick<User, 'alertEmail' | 'enableStockAlerts' | 'enableConsumptionAlerts'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>, skipMovement?: boolean) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getAllProductReferences: () => Promise<string[]>;
  reloadProducts: () => Promise<void>;

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


  // Vérifier l'utilisateur connecté
  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, username, role, name, badge_number, alert_email, enable_stock_alerts, enable_consumption_alerts')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            password: '',
            role: profile.role,
            name: profile.name,
            badgeNumber: profile.badge_number || undefined,
            alertEmail: profile.alert_email || undefined,
            enableStockAlerts: profile.enable_stock_alerts ?? true,
            enableConsumptionAlerts: profile.enable_consumption_alerts ?? true,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger toutes les données
  const loadAllData = useCallback(async () => {
    try {
      // Charger données de référence en parallèle
      await Promise.all([
        loadUsers(),
        loadCategories(),
        loadUnits(),
        loadStorageZones(),
      ]);

      // Puis charger les données principales en parallèle
      await Promise.all([
        loadProducts(),
        loadExitRequests(),
        loadStockMovements(),
        loadOrders(),
        loadPendingExits(),
        loadUserCart(),
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }, []);

  // Users - Optimisées
  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, name, role, badge_number, alert_email, enable_stock_alerts, enable_consumption_alerts')
      .order('name');

    if (!error && data) {
      setUsers(data.map(user => ({
        id: user.id,
        username: user.username,
        password: '',
        role: user.role,
        name: user.name,
        badgeNumber: user.badge_number || undefined,
        alertEmail: user.alert_email || undefined,
        enableStockAlerts: user.enable_stock_alerts ?? true,
        enableConsumptionAlerts: user.enable_consumption_alerts ?? true,
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

      console.log('Création du profil utilisateur:', profileToInsert);
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([profileToInsert])
        .select();

      if (profileError) {
        console.error('Erreur lors de la création du profil:', profileError);
        throw new Error('Erreur lors de la création du profil: ' + profileError.message);
      }

      console.log('Profil créé avec succès:', profileData);

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

    console.log('Mise à jour du badge:', { userId, badgeNumber });
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
        console.log('Mot de passe mis à jour pour correspondre au badge');
      } catch (err) {
        console.warn('Impossible de mettre à jour le mot de passe:', err);
      }
    }

    console.log('Badge mis à jour avec succès');

    // Petit délai pour garantir que la transaction est terminée
    await new Promise(resolve => setTimeout(resolve, 100));

    // Recharger les utilisateurs pour garantir la synchronisation
    await loadUsers();

    // Update currentUser si c'est lui
    if (currentUser?.id === userId) {
      const updatedUser = await supabase
        .from('user_profiles')
        .select('id, username, role, name, badge_number, alert_email, enable_stock_alerts, enable_consumption_alerts')
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
          alertEmail: updatedUser.data.alert_email || undefined,
          enableStockAlerts: updatedUser.data.enable_stock_alerts ?? true,
          enableConsumptionAlerts: updatedUser.data.enable_consumption_alerts ?? true,
        });
      }
    }
  }, [currentUser, loadUsers]);

  const updateUserProfile = useCallback(async (updates: Partial<Pick<User, 'alertEmail' | 'enableStockAlerts' | 'enableConsumptionAlerts'>>) => {
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    console.log('Mise à jour du profil utilisateur:', { userId: currentUser.id, updates });

    // Convertir les noms de champs en snake_case pour Supabase
    const dbUpdates: any = {};
    if (updates.alertEmail !== undefined) dbUpdates.alert_email = updates.alertEmail;
    if (updates.enableStockAlerts !== undefined) dbUpdates.enable_stock_alerts = updates.enableStockAlerts;
    if (updates.enableConsumptionAlerts !== undefined) dbUpdates.enable_consumption_alerts = updates.enableConsumptionAlerts;

    const { error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('id', currentUser.id);

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }

    console.log('Profil mis à jour avec succès');

    // Recharger les utilisateurs pour garantir la synchronisation
    await loadUsers();

    // Update currentUser
    const updatedUser = await supabase
      .from('user_profiles')
      .select('id, username, role, name, badge_number, alert_email, enable_stock_alerts, enable_consumption_alerts')
      .eq('id', currentUser.id)
      .single();

    if (updatedUser.data) {
      setCurrentUser({
        id: updatedUser.data.id,
        username: updatedUser.data.username,
        password: '',
        role: updatedUser.data.role,
        name: updatedUser.data.name,
        badgeNumber: updatedUser.data.badge_number || undefined,
        alertEmail: updatedUser.data.alert_email || undefined,
        enableStockAlerts: updatedUser.data.enable_stock_alerts ?? true,
        enableConsumptionAlerts: updatedUser.data.enable_consumption_alerts ?? true,
      });
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
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .order('name');

    if (!error && data) {
      setCategories(data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
      })));
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
    const { data, error } = await supabase
      .from('units')
      .select('id, name, abbreviation, is_default')
      .order('name');

    if (!error && data) {
      setUnits(data.map(unit => ({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        isDefault: unit.is_default,
      })));
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
    const { data, error } = await supabase
      .from('storage_zones')
      .select('id, name, description')
      .order('name');

    if (!error && data) {
      setStorageZones(data.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description || undefined,
      })));
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
  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, reference, designation, category_id, storage_zone_id, shelf, position, location,
        current_stock, min_stock, max_stock, unit_id, unit_price, photo,
        order_link, order_link_1, supplier_1, order_link_2, supplier_2, order_link_3, supplier_3,
        deleted_at, created_at, updated_at,
        category:categories(name),
        storage_zone:storage_zones(name),
        unit:units(abbreviation)
      `)
      .is('deleted_at', null)
      .order('reference');

    if (!error && data) {
      setProducts(data.map((p: any) => ({
        id: p.id,
        reference: p.reference,
        designation: p.designation,
        category: Array.isArray(p.category) ? (p.category[0]?.name || '') : (p.category?.name || ''),
        storageZone: Array.isArray(p.storage_zone) ? (p.storage_zone[0]?.name || undefined) : (p.storage_zone?.name || undefined),
        shelf: p.shelf || undefined,
        position: p.position || undefined,
        location: p.location,
        currentStock: p.current_stock,
        minStock: p.min_stock,
        maxStock: p.max_stock,
        unit: Array.isArray(p.unit) ? (p.unit[0]?.abbreviation || '') : (p.unit?.abbreviation || ''),
        unitPrice: p.unit_price || undefined,
        photo: p.photo || undefined,
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
      })));
    }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const categoryId = categoriesMap.get(product.category)?.id;
    const unitId = unitsMap.get(product.unit)?.id;
    const zoneId = product.storageZone ? storageZonesMap.get(product.storageZone)?.id : null;

    if (!categoryId || !unitId) {
      throw new Error('Catégorie ou unité invalide');
    }

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
        max_stock: product.maxStock,
        unit_id: unitId,
        unit_price: product.unitPrice,
        photo: product.photo,
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
      // Créer le produit local
      const dataAny = data as any;
      const newProduct: Product = {
        ...product,
        id: dataAny.id,
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
    if (updates.storageZone !== undefined) {
      const zoneId = storageZonesMap.get(updates.storageZone)?.id;
      if (zoneId) updateData.storage_zone_id = zoneId;
    }
    if (updates.shelf !== undefined) updateData.shelf = updates.shelf;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) updateData.max_stock = updates.maxStock;
    if (updates.unit !== undefined) {
      const unitId = unitsMap.get(updates.unit)?.id;
      if (unitId) updateData.unit_id = unitId;
    }
    if (updates.photo !== undefined) updateData.photo = updates.photo;
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
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
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
        const percentage = product.maxStock > 0 ? (product.currentStock / product.maxStock) * 100 : 0;
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
        maxStock: row.max_stock,
        photo: row.photo,
        storageZone: row.storage_zone,
        shelf: row.shelf,
        position: row.position,
        unit: row.unit,
      }));

      setUserCart(cart);
      console.log('Panier restauré depuis Supabase:', cart);
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
      setUserCart([]);
    }
  }, [currentUser]);

  const addToUserCart = useCallback(async (item: Omit<CartItem, 'id'>) => {
    if (!currentUser) {
      console.error('Utilisateur non connecté');
      return;
    }

    try {
      // Vérifier si le produit existe déjà dans le panier
      const existing = userCart.find(cartItem => cartItem.productId === item.productId);

      if (existing) {
        // Mettre à jour la quantité
        await updateCartItem(item.productId, existing.quantity + item.quantity);
      } else {
        // Ajouter un nouvel article
        const { data, error } = await supabase
          .from('user_cart')
          .insert({
            user_id: currentUser.id,
            product_id: item.productId,
            product_reference: item.productReference,
            product_designation: item.productDesignation,
            quantity: item.quantity,
            max_stock: item.maxStock,
            photo: item.photo,
            storage_zone: item.storageZone,
            shelf: item.shelf,
            position: item.position,
            unit: item.unit,
          })
          .select()
          .single();

        if (error) throw error;

        const newItem: CartItem = {
          productId: data.product_id,
          productReference: data.product_reference,
          productDesignation: data.product_designation,
          quantity: data.quantity,
          maxStock: data.max_stock,
          photo: data.photo,
          storageZone: data.storage_zone,
          shelf: data.shelf,
          position: data.position,
          unit: data.unit,
        };

        setUserCart(prev => [...prev, newItem]);
        console.log('Article ajouté au panier Supabase:', newItem);
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
      console.log('Quantité mise à jour dans le panier Supabase:', productId, quantity);
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
      console.log('Article supprimé du panier Supabase:', productId);
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
      console.log('Panier vidé dans Supabase');
    } catch (error) {
      console.error('Erreur lors du vidage du panier:', error);
      throw error;
    }
  }, [currentUser]);

  // Auth - Optimisées
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

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

      setCurrentUser({
        id: profile.id,
        username: profile.username,
        password: '',
        role: profile.role,
        name: profile.name,
        badgeNumber: profile.badge_number || undefined,
        alertEmail: profile.alert_email || undefined,
        enableStockAlerts: profile.enable_stock_alerts ?? true,
        enableConsumptionAlerts: profile.enable_consumption_alerts ?? true,
      });

      await loadAllData();

      // Charger les pending exits avec l'ID utilisateur directement
      // pour éviter le problème de timing avec currentUser
      try {
        const { data: exitData, error: exitError } = await supabase
          .from('pending_exits')
          .select('*')
          .eq('user_id', profile.id)
          .order('added_at', { ascending: true });

        if (exitError) throw exitError;

        const exits: PendingExit[] = (exitData || []).map(row => ({
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

      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  }, [loadAllData]);

  const loginWithBadge = useCallback(async (badgeNumber: string): Promise<boolean> => {
    try {
      // Rechercher l'utilisateur par numéro de badge
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('badge_number', badgeNumber)
        .single();

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

      // Mettre à jour le currentUser (sera aussi mis à jour par le listener onAuthStateChange)
      setCurrentUser({
        id: profile.id,
        username: profile.username,
        password: '',
        role: profile.role,
        name: profile.name,
        badgeNumber: profile.badge_number || undefined,
        alertEmail: profile.alert_email || undefined,
        enableStockAlerts: profile.enable_stock_alerts ?? true,
        enableConsumptionAlerts: profile.enable_consumption_alerts ?? true,
      });

      await loadAllData();

      // Charger les pending exits avec l'ID utilisateur directement
      // pour éviter le problème de timing avec currentUser
      try {
        const { data: exitData, error: exitError } = await supabase
          .from('pending_exits')
          .select('*')
          .eq('user_id', profile.id)
          .order('added_at', { ascending: true });

        if (exitError) throw exitError;

        const exits: PendingExit[] = (exitData || []).map(row => ({
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

      return true;
    } catch (error) {
      console.error('Erreur de connexion par badge:', error);
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
          alertEmail: undefined,
          enableStockAlerts: true,
          enableConsumptionAlerts: true,
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
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProducts([]);
    setExitRequests([]);
    setStockMovements([]);
    setOrders([]);
    setPendingExits([]);
    setUserCart([]);
  }, []);

  // Écouter les changements d'authentification et restaurer la session au rafraîchissement
  useEffect(() => {
    // Vérifier et restaurer la session au démarrage
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session initiale:', session?.user?.email);

      if (session?.user) {
        await checkUser();
        await loadAllData();
      } else {
        setLoading(false);
      }
    };

    initSession();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Utilisateur connecté ou session restaurée
        await checkUser();
        await loadAllData();
      } else if (event === 'SIGNED_OUT') {
        // Utilisateur déconnecté
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Nettoyage
    return () => {
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
    updateUserProfile,
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
    updateUserProfile,
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
