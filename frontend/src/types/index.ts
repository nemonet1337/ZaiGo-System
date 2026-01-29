// 共通の型定義

// ユーザー関連
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    locationId?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type UserRole =
    | 'SYSTEM_ADMIN'    // システム管理者
    | 'INVENTORY_MANAGER' // 在庫管理者
    | 'FIELD_OPERATOR'  // 現場担当者
    | 'ANALYST'         // 本社アナリスト
    | 'VIEWER';         // 閲覧者

// 商品関連
export interface Product {
    id: string;
    code: string;
    name: string;
    description?: string;
    category: string;
    unit: string;
    unitCost: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ロケーション関連
export interface Location {
    id: string;
    code: string;
    name: string;
    type: LocationType;
    parentId?: string;
    capacity?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type LocationType = 'WAREHOUSE' | 'AREA' | 'SHELF' | 'BIN';

// 在庫関連
export interface Stock {
    itemId: string;
    locationId: string;
    quantity: number;
    reserved: number;
    available: number;
    version: number;
    updatedAt: string;
    updatedBy: string;
}

export interface StockWithDetails extends Stock {
    product: Product;
    location: Location;
    lots?: Lot[];
}

// ロット関連
export interface Lot {
    id: string;
    number: string;
    itemId: string;
    locationId: string;
    quantity: number;
    expiryDate?: string;
    manufacturedDate?: string;
    createdAt: string;
}

// 在庫移動（トランザクション）
export interface Transaction {
    id: string;
    type: TransactionType;
    itemId: string;
    fromLocationId?: string;
    toLocationId?: string;
    quantity: number;
    reference: string;
    lotNumber?: string;
    metadata?: Record<string, string>;
    createdAt: string;
    createdBy: string;
}

export type TransactionType = 'inbound' | 'outbound' | 'transfer' | 'adjust';

// 棚卸関連
export interface Stocktaking {
    id: string;
    locationId: string;
    status: StocktakingStatus;
    scheduledDate: string;
    completedDate?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdBy: string;
    createdAt: string;
}

export type StocktakingStatus = 'DRAFT' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface StocktakingItem {
    id: string;
    stocktakingId: string;
    itemId: string;
    locationId: string;
    systemQuantity: number;
    actualQuantity: number;
    discrepancy: number;
    note?: string;
}

// アラート関連
export interface StockAlert {
    id: string;
    type: AlertType;
    itemId: string;
    locationId: string;
    message: string;
    isActive: boolean;
    createdAt: string;
    resolvedAt?: string;
}

export type AlertType = 'low_stock' | 'over_stock' | 'expiring' | 'expired' | 'discrepancy';

// 監査ログ
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    details: Record<string, unknown>;
    ipAddress: string;
    createdAt: string;
}

// API レスポンス
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// 検索・フィルタ
export interface StockSearchParams {
    productCode?: string;
    productName?: string;
    locationId?: string;
    category?: string;
    minQuantity?: number;
    maxQuantity?: number;
    page?: number;
    pageSize?: number;
}
