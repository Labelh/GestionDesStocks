import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Product, Category, Unit, StorageZone, ExitRequest, StockAlert, StockMovement } from '../types';

interface AppContextType {
  // Auth
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, name: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Units
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // Storage Zones
  storageZones: StorageZone[];
  addStorageZone: (zone: Omit<StorageZone, 'id'>) => Promise<void>;
  deleteStorageZone: (id: string) => Promise<void>;

  // Exit Requests
  exitRequests: ExitRequest[];
  addExitRequest: (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => Promise<void>;
  updateExitRequest: (id: string, updates: Partial<ExitRequest>) => Promise<void>;
  deleteExitRequest: (id: string) => Promise<void>;

  // Stock Alerts
  getStockAlerts: () => StockAlert[];

  // Stock Movements
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => Promise<void>;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [storageZones, setStorageZones] = useState<StorageZone[]>([]);
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Charger les données au démarrage
  useEffect(() => {
    checkUser();
    loadAllData();
  }, []);

  // Vérifier l'utilisateur connecté
  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            password: '', // On ne stocke jamais le mot de passe
            role: profile.role,
            name: profile.name,
          });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger toutes les données
  const loadAllData = async () => {
    await Promise.all([
      loadCategories(),
      loadUnits(),
      loadStorageZones(),
      loadProducts(),
      loadExitRequests(),
      loadStockMovements(),
    ]);
  };

  // Categories
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
      })));
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
      }]);
    } else {
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
    } else {
      throw error;
    }
  };

  // Units
  const loadUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');

    if (!error && data) {
      setUnits(data.map(unit => ({
        id: unit.id,
        name: unit.name,
        abbreviation: unit.abbreviation,
        isDefault: unit.is_default,
      })));
    }
  };

  const addUnit = async (unit: Omit<Unit, 'id'>) => {
    const { data, error } = await supabase
      .from('units')
      .insert([{ ...unit, is_default: unit.isDefault }])
      .select()
      .single();

    if (!error && data) {
      setUnits([...units, {
        id: data.id,
        name: data.name,
        abbreviation: data.abbreviation,
        isDefault: data.is_default,
      }]);
    } else {
      throw error;
    }
  };

  const deleteUnit = async (id: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (!error) {
      setUnits(units.filter(u => u.id !== id));
    } else {
      throw error;
    }
  };

  // Storage Zones
  const loadStorageZones = async () => {
    const { data, error } = await supabase
      .from('storage_zones')
      .select('*')
      .order('name');

    if (!error && data) {
      setStorageZones(data.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description || undefined,
      })));
    }
  };

  const addStorageZone = async (zone: Omit<StorageZone, 'id'>) => {
    const { data, error } = await supabase
      .from('storage_zones')
      .insert([zone])
      .select()
      .single();

    if (!error && data) {
      setStorageZones([...storageZones, {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
      }]);
    } else {
      throw error;
    }
  };

  const deleteStorageZone = async (id: string) => {
    const { error } = await supabase
      .from('storage_zones')
      .delete()
      .eq('id', id);

    if (!error) {
      setStorageZones(storageZones.filter(z => z.id !== id));
    } else {
      throw error;
    }
  };

  // Products
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('reference');

    if (!error && data) {
      setProducts(data.map(p => ({
        id: p.id,
        reference: p.reference,
        designation: p.designation,
        category: categories.find(c => c.id === p.category_id)?.name || '',
        storageZone: p.storage_zone_id ? storageZones.find(z => z.id === p.storage_zone_id)?.name : undefined,
        shelf: p.shelf || undefined,
        position: p.position || undefined,
        location: p.location,
        currentStock: p.current_stock,
        minStock: p.min_stock,
        maxStock: p.max_stock,
        unit: units.find(u => u.id === p.unit_id)?.abbreviation || '',
        photo: p.photo || undefined,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      })));
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const categoryId = categories.find(c => c.name === product.category)?.id;
    const unitId = units.find(u => u.abbreviation === product.unit)?.id;
    const zoneId = product.storageZone ? storageZones.find(z => z.name === product.storageZone)?.id : null;

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
        photo: product.photo,
      }])
      .select()
      .single();

    if (!error && data && currentUser) {
      await addStockMovement({
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
      await loadProducts();
    } else {
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const updateData: any = {};

    if (updates.designation) updateData.designation = updates.designation;
    if (updates.category) {
      const categoryId = categories.find(c => c.name === updates.category)?.id;
      if (categoryId) updateData.category_id = categoryId;
    }
    if (updates.storageZone) {
      const zoneId = storageZones.find(z => z.name === updates.storageZone)?.id;
      if (zoneId) updateData.storage_zone_id = zoneId;
    }
    if (updates.shelf !== undefined) updateData.shelf = updates.shelf;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.location) updateData.location = updates.location;
    if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) updateData.max_stock = updates.maxStock;
    if (updates.unit) {
      const unitId = units.find(u => u.abbreviation === updates.unit)?.id;
      if (unitId) updateData.unit_id = unitId;
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      // Enregistrer le mouvement de stock si le stock a changé
      if (updates.currentStock !== undefined && updates.currentStock !== product.currentStock && currentUser) {
        const quantity = updates.currentStock - product.currentStock;
        await addStockMovement({
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
      await loadProducts();
    } else {
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      throw error;
    }
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  // Exit Requests
  const loadExitRequests = async () => {
    const { data, error } = await supabase
      .from('exit_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (!error && data) {
      setExitRequests(data.map(r => ({
        id: r.id,
        productId: r.product_id,
        productReference: r.product_reference,
        productDesignation: r.product_designation,
        quantity: r.quantity,
        requestedBy: r.requested_by,
        requestedAt: new Date(r.requested_at),
        status: r.status as 'pending' | 'approved' | 'rejected',
        approvedBy: r.approved_by || undefined,
        approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
        reason: r.reason || undefined,
        notes: r.notes || undefined,
      })));
    }
  };

  const addExitRequest = async (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('exit_requests')
      .insert([{
        ...request,
        requested_by: currentUser.id,
        status: 'pending',
      }])
      .select()
      .single();

    if (!error && data) {
      await loadExitRequests();
    } else {
      throw error;
    }
  };

  const updateExitRequest = async (id: string, updates: Partial<ExitRequest>) => {
    const request = exitRequests.find(r => r.id === id);

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.approvedBy) updateData.approved_by = updates.approvedBy;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.status === 'approved' || updates.status === 'rejected') {
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('exit_requests')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      // Si approuvé, mettre à jour le stock
      if (updates.status === 'approved' && request && currentUser) {
        const product = products.find(p => p.id === request.productId);
        if (product) {
          const newStock = product.currentStock - request.quantity;
          await updateProduct(product.id, { currentStock: newStock });

          await addStockMovement({
            productId: product.id,
            productReference: product.reference,
            productDesignation: product.designation,
            movementType: 'exit',
            quantity: request.quantity,
            previousStock: product.currentStock,
            newStock: newStock,
            userId: currentUser.id,
            userName: currentUser.name,
            reason: `Demande approuvée - ${request.reason || 'Sortie de stock'}`,
            notes: request.notes,
          });
        }
      }
      await loadExitRequests();
    } else {
      throw error;
    }
  };

  const deleteExitRequest = async (id: string) => {
    const { error } = await supabase
      .from('exit_requests')
      .delete()
      .eq('id', id);

    if (!error) {
      setExitRequests(exitRequests.filter(r => r.id !== id));
    } else {
      throw error;
    }
  };

  // Stock Movements
  const loadStockMovements = async () => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000); // Limiter aux 1000 derniers mouvements

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
  };

  const addStockMovement = async (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
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
      await loadStockMovements();
    }
  };

  // Stock Alerts
  const getStockAlerts = (): StockAlert[] => {
    const alerts: StockAlert[] = [];

    products.forEach(product => {
      if (product.currentStock <= product.minStock) {
        const percentage = (product.currentStock / product.maxStock) * 100;
        alerts.push({
          product,
          alertType: product.currentStock === 0 ? 'critical' : 'low',
          percentage: Math.round(percentage)
        });
      }
    });

    return alerts.sort((a, b) => a.percentage - b.percentage);
  };

  // Auth
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // D'abord, trouver l'utilisateur par username
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!profile) {
        return false;
      }

      // Se connecter avec l'email (Supabase utilise l'email, on utilise l'ID comme email)
      const email = `${username}@gestionstocks.local`;
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
      });

      await loadAllData();
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const register = async (username: string, name: string, password: string): Promise<boolean> => {
    try {
      // Vérifier si le username existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) {
        console.error('Erreur lors de la vérification du username:', checkError);
      }

      if (existingProfile) {
        console.error('Cet identifiant existe déjà');
        return false;
      }

      // Créer l'utilisateur dans Supabase Auth
      const email = `${username}@gestionstocks.local`;
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

      console.log('Auth response:', { authData, authError });

      if (authError) {
        console.error('Erreur lors de la création du compte:', authError.message, authError);
        return false;
      }

      if (!authData.user) {
        console.error('Aucun utilisateur créé');
        return false;
      }

      // Attendre un peu pour que l'utilisateur soit bien créé
      await new Promise(resolve => setTimeout(resolve, 500));

      // Créer le profil utilisateur (par défaut role = 'user')
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          username,
          name,
          role: 'user',
        }]);

      if (profileError) {
        console.error('Erreur lors de la création du profil:', profileError.message, profileError);
        return false;
      }

      // Si l'email confirmation est requise, on ne peut pas connecter automatiquement
      // Dans ce cas, on informe l'utilisateur
      if (authData.session) {
        // Session créée, connexion automatique
        setCurrentUser({
          id: authData.user.id,
          username,
          password: '',
          role: 'user',
          name,
        });

        await loadAllData();
      } else {
        // Pas de session, l'email confirmation est probablement requise
        // Essayer de se connecter manuellement
        const loginSuccess = await login(username, password);
        if (!loginSuccess) {
          console.warn('Compte créé mais confirmation d\'email requise');
          // Le compte existe mais nécessite une confirmation
          // On retourne true car l'inscription a réussi
        }
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProducts([]);
    setExitRequests([]);
    setStockMovements([]);
  };

  const value: AppContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    categories,
    addCategory,
    deleteCategory,
    units,
    addUnit,
    deleteUnit,
    storageZones,
    addStorageZone,
    deleteStorageZone,
    exitRequests,
    addExitRequest,
    updateExitRequest,
    deleteExitRequest,
    getStockAlerts,
    stockMovements,
    addStockMovement,
  };

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
