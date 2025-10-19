import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Product, Category, Unit, StorageZone, ExitRequest, StockAlert, StockMovement, PendingExit, Order } from '../types';

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
  getAllProductReferences: () => Promise<string[]>;

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
  getPendingExits: () => PendingExit[];
  addPendingExit: (exit: Omit<PendingExit, 'id' | 'addedAt'>) => void;
  clearPendingExits: () => void;
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
  const [orders, setOrders] = useState<Order[]>([]);

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
    // Charger d'abord les données de référence
    await Promise.all([
      loadCategories(),
      loadUnits(),
      loadStorageZones(),
    ]);

    // Puis charger les données qui en dépendent
    await Promise.all([
      loadProducts(),
      loadExitRequests(),
      loadStockMovements(),
      loadOrders(),
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
      .select(`
        *,
        category:categories(name),
        storage_zone:storage_zones(name),
        unit:units(abbreviation)
      `)
      .is('deleted_at', null) // Filtrer les produits supprimés
      .order('reference');

    if (!error && data) {
      setProducts(data.map(p => ({
        id: p.id,
        reference: p.reference,
        designation: p.designation,
        category: p.category?.name || '',
        storageZone: p.storage_zone?.name || undefined,
        shelf: p.shelf || undefined,
        position: p.position || undefined,
        location: p.location,
        currentStock: p.current_stock,
        minStock: p.min_stock,
        maxStock: p.max_stock,
        unit: p.unit?.abbreviation || '',
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
    console.log('Mise à jour du produit:', { id, updates });
    const product = products.find(p => p.id === id);
    if (!product) {
      console.error('Produit introuvable:', id);
      return;
    }

    const updateData: any = {};

    if (updates.designation !== undefined) updateData.designation = updates.designation;
    if (updates.category !== undefined) {
      const categoryId = categories.find(c => c.name === updates.category)?.id;
      if (categoryId) updateData.category_id = categoryId;
    }
    if (updates.storageZone !== undefined) {
      const zoneId = storageZones.find(z => z.name === updates.storageZone)?.id;
      if (zoneId) updateData.storage_zone_id = zoneId;
    }
    if (updates.shelf !== undefined) updateData.shelf = updates.shelf;
    if (updates.position !== undefined) updateData.position = updates.position;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.currentStock !== undefined) updateData.current_stock = updates.currentStock;
    if (updates.minStock !== undefined) updateData.min_stock = updates.minStock;
    if (updates.maxStock !== undefined) updateData.max_stock = updates.maxStock;
    if (updates.unit !== undefined) {
      const unitId = units.find(u => u.abbreviation === updates.unit)?.id;
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

    console.log('Données à envoyer à Supabase:', updateData);

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }

    console.log('Produit mis à jour avec succès dans Supabase');

    // Enregistrer le mouvement de stock si le stock a changé
    if (updates.currentStock !== undefined && updates.currentStock !== product.currentStock && currentUser) {
      console.log('Enregistrement du mouvement de stock');
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

    console.log('Rechargement des produits...');
    await loadProducts();
    console.log('Produits rechargés');
  };

  const deleteProduct = async (id: string) => {
    try {
      // Suppression logique : marquer le produit comme supprimé
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        // Filtrer le produit de la liste locale
        setProducts(products.filter(p => p.id !== id));
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const getAllProductReferences = async (): Promise<string[]> => {
    // Récupérer TOUTES les références, même des produits supprimés
    const { data, error } = await supabase
      .from('products')
      .select('reference');

    if (error || !data) {
      console.error('Erreur lors de la récupération des références:', error);
      return [];
    }

    return data.map(p => p.reference);
  };

  // Exit Requests
  const loadExitRequests = async () => {
    const { data, error } = await supabase
      .from('exit_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      return;
    }

    if (data) {
      console.log('Demandes chargées:', data.length);

      // Charger les profils utilisateurs pour obtenir les usernames
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
  };

  const addExitRequest = async (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status' | 'requestedBy'>) => {
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      throw new Error('Utilisateur non connecté');
    }

    console.log('Ajout de demande:', { request, currentUser: currentUser.id });

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

    console.log('Demande ajoutée avec succès:', data);
    await loadExitRequests();
  };

  const updateExitRequest = async (id: string, updates: Partial<ExitRequest>) => {
    console.log('Mise à jour de la demande:', { id, updates });
    const request = exitRequests.find(r => r.id === id);

    if (!request) {
      console.error('Demande introuvable:', id);
      throw new Error('Demande introuvable');
    }

    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.approvedBy) updateData.approved_by = updates.approvedBy;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.receivedAt) updateData.received_at = updates.receivedAt.toISOString();

    // Approuver = mettre en attente de réception
    if (updates.status === 'awaiting_reception') {
      updateData.approved_at = new Date().toISOString();
    }

    // Refuser
    if (updates.status === 'rejected') {
      updateData.approved_at = new Date().toISOString();
    }

    console.log('Données à mettre à jour:', updateData);

    const { error } = await supabase
      .from('exit_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la mise à jour de la demande:', error);
      throw error;
    }

    console.log('Demande mise à jour avec succès');

    // Si approuvée, soustraire la quantité du stock (demande de sortie)
    if (updates.status === 'approved' && request && currentUser) {
      console.log('Soustraction du stock pour le produit:', request.productId);
      const product = products.find(p => p.id === request.productId);
      if (product) {
        const newStock = product.currentStock - request.quantity;
        console.log(`Ancien stock: ${product.currentStock}, Nouveau stock: ${newStock} (sortie de ${request.quantity})`);

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
          reason: `Sortie de stock - ${request.reason || 'Demande approuvée'}`,
          notes: request.notes,
        });

        // Ajouter au tableau des sorties à imprimer
        addPendingExit({
          productReference: product.reference,
          productDesignation: product.designation,
          storageZone: product.storageZone,
          shelf: product.shelf,
          position: product.position,
          quantity: request.quantity,
          requestedBy: request.requestedBy,
        });
      } else {
        console.error('Produit introuvable:', request.productId);
      }
    }

    await loadExitRequests();
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

  // Orders
  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('ordered_at', { ascending: false });

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
  };

  const addOrder = async (order: Omit<Order, 'id' | 'ordered_at' | 'ordered_by' | 'ordered_by_name' | 'status' | 'created_at' | 'updated_at'>) => {
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
      console.error('Erreur lors de l\'ajout de la commande:', error);
      throw error;
    }

    if (data) {
      await loadOrders();
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.received_at !== undefined) updateData.received_at = updates.received_at;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error;
    }

    await loadOrders();
  };

  const getPendingOrders = (): Order[] => {
    return orders.filter(o => o.status === 'pending');
  };

  const getAverageDeliveryTime = (): number => {
    const receivedOrders = orders.filter(o => o.status === 'received' && o.received_at);

    if (receivedOrders.length === 0) return 0;

    const totalTime = receivedOrders.reduce((sum, order) => {
      const orderTime = new Date(order.ordered_at).getTime();
      const receiveTime = new Date(order.received_at!).getTime();
      const diffDays = (receiveTime - orderTime) / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return Math.round(totalTime / receivedOrders.length * 10) / 10; // Arrondi à 1 décimale
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

  // Pending Exits (stored in localStorage)
  const PENDING_EXITS_KEY = 'gestionstock_pending_exits';

  const getPendingExits = (): PendingExit[] => {
    try {
      const stored = localStorage.getItem(PENDING_EXITS_KEY);
      return stored ? JSON.parse(stored).map((exit: any) => ({
        ...exit,
        addedAt: new Date(exit.addedAt)
      })) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des sorties en attente:', error);
      return [];
    }
  };

  const addPendingExit = (exit: Omit<PendingExit, 'id' | 'addedAt'>) => {
    try {
      const pendingExits = getPendingExits();
      const newExit: PendingExit = {
        ...exit,
        id: `exit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date(),
      };
      localStorage.setItem(PENDING_EXITS_KEY, JSON.stringify([...pendingExits, newExit]));
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la sortie en attente:', error);
    }
  };

  const clearPendingExits = () => {
    try {
      localStorage.removeItem(PENDING_EXITS_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression des sorties en attente:', error);
    }
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

      // Se connecter avec l'email (Supabase utilise l'email)
      const email = `${username}@gestionstocks.app`;
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
      // Utiliser un domaine valide pour éviter les erreurs de validation
      const email = `${username}@gestionstocks.app`;
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
    getAllProductReferences,
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
    orders,
    addOrder,
    updateOrder,
    getPendingOrders,
    getAverageDeliveryTime,
    getPendingExits,
    addPendingExit,
    clearPendingExits,
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
