import { Product, Category, Unit, ExitRequest, User } from '../types';

// Configuration de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fonction helper pour les requêtes
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Une erreur est survenue' }));
    throw new Error(error.error || 'Erreur réseau');
  }

  return response.json();
};

// API Auth
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register: async (userData: { username: string; password: string; role: string; name: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },
};

// API Products
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    return apiRequest('/products');
  },

  getById: async (id: string): Promise<Product> => {
    return apiRequest(`/products/${id}`);
  },

  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  update: async (id: string, updates: Partial<Product>) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  getLowStock: async (): Promise<Product[]> => {
    return apiRequest('/products/alerts/low-stock');
  },
};

// API Categories
export const categoriesAPI = {
  getAll: async (): Promise<Category[]> => {
    return apiRequest('/categories');
  },

  create: async (category: Omit<Category, 'id'>) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// API Units
export const unitsAPI = {
  getAll: async (): Promise<Unit[]> => {
    return apiRequest('/units');
  },

  create: async (unit: Omit<Unit, 'id'>) => {
    return apiRequest('/units', {
      method: 'POST',
      body: JSON.stringify(unit),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/units/${id}`, {
      method: 'DELETE',
    });
  },
};

// API Exit Requests
export const exitRequestsAPI = {
  getAll: async (filters?: { status?: string; requestedBy?: string }): Promise<ExitRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requestedBy) params.append('requestedBy', filters.requestedBy);

    const queryString = params.toString();
    return apiRequest(`/exit-requests${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string): Promise<ExitRequest> => {
    return apiRequest(`/exit-requests/${id}`);
  },

  create: async (request: {
    productId: string;
    productReference: string;
    productDesignation: string;
    quantity: number;
    requestedBy: string;
    reason: string;
  }) => {
    return apiRequest('/exit-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  update: async (id: string, updates: { status: string; approvedBy: string; notes?: string }) => {
    return apiRequest(`/exit-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/exit-requests/${id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  categories: categoriesAPI,
  units: unitsAPI,
  exitRequests: exitRequestsAPI,
};
