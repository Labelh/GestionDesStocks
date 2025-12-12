export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  badgeNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  isDefault: boolean;
}

export interface ShelfConfig {
  shelfNumber: number;
  rows: number;
  columns: number;
}

export interface StorageZone {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  reference: string;
  customerReference?: string; // Référence client
  designation: string;
  category: string;
  storageZone?: string;
  shelf?: number;
  position?: number;
  location: string; // Deprecated - kept for backward compatibility
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitPrice?: number; // Prix unitaire du produit
  photo?: string;
  orderLink?: string; // Lien pour commander le produit (deprecated, kept for backward compatibility)
  orderLink1?: string; // Premier lien de commande
  supplier1?: string; // Nom du fournisseur 1
  orderLink2?: string; // Deuxième lien de commande
  supplier2?: string; // Nom du fournisseur 2
  orderLink3?: string; // Troisième lien de commande
  supplier3?: string; // Nom du fournisseur 3
  deletedAt?: Date; // Suppression logique
  createdAt: Date;
  updatedAt: Date;
}

export interface ExitRequest {
  id: string;
  productId: string;
  productReference: string;
  productDesignation: string;
  productPhoto?: string;
  quantity: number;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'awaiting_reception' | 'approved' | 'rejected' | 'discrepancy';
  approvedBy?: string;
  approvedAt?: Date;
  receivedAt?: Date;
  reason?: string;
  notes?: string;
}

export interface StockAlert {
  product: Product;
  alertType: 'low' | 'critical';
  percentage: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productReference: string;
  productDesignation: string;
  movementType: 'entry' | 'exit' | 'adjustment' | 'initial';
  quantity: number;
  previousStock: number;
  newStock: number;
  userId: string;
  userName: string;
  reason: string;
  notes?: string;
  timestamp: Date;
}

export interface PendingExit {
  id: string;
  productReference: string;
  productDesignation: string;
  storageZone?: string;
  shelf?: number;
  position?: number;
  quantity: number;
  requestedBy: string;
  addedAt: Date;
}

export interface Order {
  id: string;
  product_id: string;
  product_reference: string;
  product_designation: string;
  quantity: number;
  ordered_by: string;
  ordered_by_name: string;
  ordered_at: Date;
  received_at?: Date;
  status: 'pending' | 'received' | 'cancelled';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CartItem {
  productId: string;
  productReference: string;
  productDesignation: string;
  quantity: number;
  maxStock: number;
  photo?: string;
  storageZone?: string;
  shelf?: number;
  position?: number;
  unit?: string;
}
