import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Category, Unit, StorageZone, ExitRequest, StockAlert, StockMovement } from '../types';

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;

  // Units
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  deleteUnit: (id: string) => void;

  // Storage Zones
  storageZones: StorageZone[];
  addStorageZone: (zone: Omit<StorageZone, 'id'>) => void;
  deleteStorageZone: (id: string) => void;

  // Exit Requests
  exitRequests: ExitRequest[];
  addExitRequest: (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateExitRequest: (id: string, updates: Partial<ExitRequest>) => void;
  deleteExitRequest: (id: string) => void;

  // Stock Alerts
  getStockAlerts: () => StockAlert[];

  // Stock Movements
  stockMovements: StockMovement[];
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [storageZones, setStorageZones] = useState<StorageZone[]>([]);
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedProducts = localStorage.getItem('products');
    const savedCategories = localStorage.getItem('categories');
    const savedUnits = localStorage.getItem('units');
    const savedStorageZones = localStorage.getItem('storageZones');
    const savedExitRequests = localStorage.getItem('exitRequests');
    const savedStockMovements = localStorage.getItem('stockMovements');

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedUnits) setUnits(JSON.parse(savedUnits));
    if (savedStorageZones) setStorageZones(JSON.parse(savedStorageZones));
    if (savedExitRequests) setExitRequests(JSON.parse(savedExitRequests));
    if (savedStockMovements) setStockMovements(JSON.parse(savedStockMovements));

    // Initialize default data if empty
    if (!savedCategories || JSON.parse(savedCategories).length === 0) {
      const defaultCategories = [
        { id: '1', name: 'Électronique', description: 'Composants électroniques' },
        { id: '2', name: 'Mécanique', description: 'Pièces mécaniques' },
        { id: '3', name: 'Consommables', description: 'Produits consommables' },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('categories', JSON.stringify(defaultCategories));
    }

    if (!savedUnits || JSON.parse(savedUnits).length === 0) {
      const defaultUnits = [
        { id: '1', name: 'Pièce', abbreviation: 'pcs', isDefault: true },
        { id: '2', name: 'Kilogramme', abbreviation: 'kg', isDefault: false },
        { id: '3', name: 'Litre', abbreviation: 'L', isDefault: false },
        { id: '4', name: 'Mètre', abbreviation: 'm', isDefault: false },
        { id: '5', name: 'Unité unique', abbreviation: 'unité', isDefault: false },
      ];
      setUnits(defaultUnits);
      localStorage.setItem('units', JSON.stringify(defaultUnits));
    }

    if (!savedStorageZones || JSON.parse(savedStorageZones).length === 0) {
      const defaultZones = [
        { id: '1', name: 'Zone A', description: 'Entrepôt principal' },
        { id: '2', name: 'Zone B', description: 'Stockage secondaire' },
        { id: '3', name: 'Zone C', description: 'Réserve' },
      ];
      setStorageZones(defaultZones);
      localStorage.setItem('storageZones', JSON.stringify(defaultZones));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('storageZones', JSON.stringify(storageZones));
  }, [storageZones]);

  useEffect(() => {
    localStorage.setItem('exitRequests', JSON.stringify(exitRequests));
  }, [exitRequests]);

  useEffect(() => {
    localStorage.setItem('stockMovements', JSON.stringify(stockMovements));
  }, [stockMovements]);

  // Auth functions
  const login = (username: string, password: string): boolean => {
    // Default users
    const users: User[] = [
      { id: '1', username: 'admin', password: 'admin', role: 'manager', name: 'Gestionnaire' },
      { id: '2', username: 'user', password: 'user', role: 'user', name: 'Utilisateur' },
    ];

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Stock Movement functions
  const addStockMovement = (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
    const newMovement: StockMovement = {
      ...movement,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setStockMovements([newMovement, ...stockMovements]);
  };

  // Product functions
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);

    // Enregistrer le mouvement initial
    if (currentUser) {
      addStockMovement({
        productId: newProduct.id,
        productReference: newProduct.reference,
        productDesignation: newProduct.designation,
        movementType: 'initial',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: 'Création du produit',
      });
    }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const product = products.find(p => p.id === id);
    if (product && updates.currentStock !== undefined && updates.currentStock !== product.currentStock) {
      // Enregistrer le mouvement de stock
      if (currentUser) {
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
    }

    setProducts(products.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  // Category functions
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories([...categories, newCategory]);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  // Unit functions
  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit: Unit = {
      ...unit,
      id: Date.now().toString(),
    };
    setUnits([...units, newUnit]);
  };

  const deleteUnit = (id: string) => {
    setUnits(units.filter(u => u.id !== id));
  };

  // Storage Zone functions
  const addStorageZone = (zone: Omit<StorageZone, 'id'>) => {
    const newZone: StorageZone = {
      ...zone,
      id: Date.now().toString(),
    };
    setStorageZones([...storageZones, newZone]);
  };

  const deleteStorageZone = (id: string) => {
    setStorageZones(storageZones.filter(z => z.id !== id));
  };

  // Exit Request functions
  const addExitRequest = (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest: ExitRequest = {
      ...request,
      id: Date.now().toString(),
      requestedAt: new Date(),
      status: 'pending',
    };
    setExitRequests([...exitRequests, newRequest]);
  };

  const updateExitRequest = (id: string, updates: Partial<ExitRequest>) => {
    setExitRequests(exitRequests.map(r =>
      r.id === id ? { ...r, ...updates } : r
    ));

    // If approved, update product stock
    if (updates.status === 'approved') {
      const request = exitRequests.find(r => r.id === id);
      if (request) {
        const product = products.find(p => p.id === request.productId);
        if (product && currentUser) {
          const newStock = product.currentStock - request.quantity;
          updateProduct(product.id, {
            currentStock: newStock
          });

          // Enregistrer le mouvement de sortie
          addStockMovement({
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
    }
  };

  const deleteExitRequest = (id: string) => {
    setExitRequests(exitRequests.filter(r => r.id !== id));
  };

  // Stock Alert functions
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

  const value: AppContextType = {
    currentUser,
    login,
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
