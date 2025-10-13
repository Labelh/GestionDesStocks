import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Category, Unit, ExitRequest, StockAlert } from '../types';

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

  // Exit Requests
  exitRequests: ExitRequest[];
  addExitRequest: (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateExitRequest: (id: string, updates: Partial<ExitRequest>) => void;

  // Stock Alerts
  getStockAlerts: () => StockAlert[];
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
  const [exitRequests, setExitRequests] = useState<ExitRequest[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedProducts = localStorage.getItem('products');
    const savedCategories = localStorage.getItem('categories');
    const savedUnits = localStorage.getItem('units');
    const savedExitRequests = localStorage.getItem('exitRequests');

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedUnits) setUnits(JSON.parse(savedUnits));
    if (savedExitRequests) setExitRequests(JSON.parse(savedExitRequests));

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
    localStorage.setItem('exitRequests', JSON.stringify(exitRequests));
  }, [exitRequests]);

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

  // Product functions
  const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
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
        if (product) {
          updateProduct(product.id, {
            currentStock: product.currentStock - request.quantity
          });
        }
      }
    }
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
    exitRequests,
    addExitRequest,
    updateExitRequest,
    getStockAlerts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
