import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Product, Category, Unit, ExitRequest, StockAlert } from '../types';
import api from '../services/api';

interface AppContextType {
  // Auth
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;

  // Units
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  refreshUnits: () => Promise<void>;

  // Exit Requests
  exitRequests: ExitRequest[];
  addExitRequest: (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => Promise<void>;
  updateExitRequest: (id: string, updates: Partial<ExitRequest>) => Promise<void>;
  refreshExitRequests: () => Promise<void>;

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
  const [loading, setLoading] = useState(true);

  // Charger les données initiales
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier si un token existe
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('currentUser');

        if (token && savedUser) {
          try {
            const user = await api.auth.getMe();
            setCurrentUser(user);

            // Charger toutes les données
            await Promise.all([
              refreshProducts(),
              refreshCategories(),
              refreshUnits(),
              refreshExitRequests(),
            ]);
          } catch (error) {
            // Token invalide, nettoyer
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Auth functions
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.auth.login(username, password);

      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        setCurrentUser(response.user);

        // Charger toutes les données après connexion
        await Promise.all([
          refreshProducts(),
          refreshCategories(),
          refreshUnits(),
          refreshExitRequests(),
        ]);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setProducts([]);
    setCategories([]);
    setUnits([]);
    setExitRequests([]);
  };

  // Product functions
  const refreshProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.products.create(product);
      await refreshProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await api.products.update(id, updates);
      await refreshProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.products.delete(id);
      await refreshProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id.toString() === id.toString());
  };

  // Category functions
  const refreshCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      await api.categories.create(category);
      await refreshCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.categories.delete(id);
      await refreshCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Unit functions
  const refreshUnits = async () => {
    try {
      const data = await api.units.getAll();
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const addUnit = async (unit: Omit<Unit, 'id'>) => {
    try {
      await api.units.create(unit);
      await refreshUnits();
    } catch (error) {
      console.error('Error adding unit:', error);
      throw error;
    }
  };

  const deleteUnit = async (id: string) => {
    try {
      await api.units.delete(id);
      await refreshUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      throw error;
    }
  };

  // Exit Request functions
  const refreshExitRequests = async () => {
    try {
      const data = await api.exitRequests.getAll();
      setExitRequests(data);
    } catch (error) {
      console.error('Error fetching exit requests:', error);
    }
  };

  const addExitRequest = async (request: Omit<ExitRequest, 'id' | 'requestedAt' | 'status'>) => {
    try {
      await api.exitRequests.create({
        productId: request.productId,
        productReference: request.productReference,
        productDesignation: request.productDesignation,
        quantity: request.quantity,
        requestedBy: request.requestedBy,
        reason: request.reason || '',
      });
      await refreshExitRequests();
    } catch (error) {
      console.error('Error adding exit request:', error);
      throw error;
    }
  };

  const updateExitRequest = async (id: string, updates: Partial<ExitRequest>) => {
    try {
      await api.exitRequests.update(id, {
        status: updates.status!,
        approvedBy: updates.approvedBy!,
        notes: updates.notes,
      });

      // Rafraîchir les données
      await Promise.all([
        refreshExitRequests(),
        refreshProducts(), // Rafraîchir les produits car le stock peut avoir changé
      ]);
    } catch (error) {
      console.error('Error updating exit request:', error);
      throw error;
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
    loading,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    refreshProducts,
    categories,
    addCategory,
    deleteCategory,
    refreshCategories,
    units,
    addUnit,
    deleteUnit,
    refreshUnits,
    exitRequests,
    addExitRequest,
    updateExitRequest,
    refreshExitRequests,
    getStockAlerts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
