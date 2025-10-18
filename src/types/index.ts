export type UserRole = 'user' | 'manager';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
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

export interface StorageZone {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  reference: string;
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
  status: 'pending' | 'awaiting_reception' | 'approved' | 'rejected';
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
