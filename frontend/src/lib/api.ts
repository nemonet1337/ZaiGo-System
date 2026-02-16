const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            credentials: 'include', // Cookie認証用
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'エラーが発生しました' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // 認証関連
    auth = {
        login: (email: string, password: string) =>
            this.request<{ user: import('@/types').User; token: string }>('/auth/login', {
                method: 'POST',
                body: { email, password },
            }),
        logout: () => this.request('/auth/logout', { method: 'POST' }),
        me: () => this.request<import('@/types').User>('/auth/me'),
    };

    // 在庫関連
    inventory = {
        getStock: (itemId: string, locationId: string) =>
            this.request<import('@/types').Stock>(`/inventory/${itemId}/${locationId}`),
        search: (params: import('@/types').StockSearchParams) =>
            this.request<import('@/types').PaginatedResponse<import('@/types').StockWithDetails>>(
                `/inventory?${new URLSearchParams(params as Record<string, string>).toString()}`
            ),
        add: (data: { itemId: string; locationId: string; quantity: number; reference: string; lotNumber?: string }) =>
            this.request('/inventory/add', {
                method: 'POST',
                body: {
                    item_id: data.itemId,
                    location_id: data.locationId,
                    quantity: data.quantity,
                    reference: data.reference,
                },
            }),
        remove: (data: { itemId: string; locationId: string; quantity: number; reference: string }) =>
            this.request('/inventory/remove', {
                method: 'POST',
                body: {
                    item_id: data.itemId,
                    location_id: data.locationId,
                    quantity: data.quantity,
                    reference: data.reference,
                },
            }),
        transfer: (data: { itemId: string; fromLocationId: string; toLocationId: string; quantity: number; reference: string }) =>
            this.request('/inventory/transfer', {
                method: 'POST',
                body: {
                    item_id: data.itemId,
                    from_location_id: data.fromLocationId,
                    to_location_id: data.toLocationId,
                    quantity: data.quantity,
                    reference: data.reference,
                },
            }),
        getHistory: (itemId: string, limit?: number) =>
            this.request<import('@/types').Transaction[]>(`/inventory/${itemId}/history?limit=${limit || 50}`),
        getAlerts: (locationId: string = 'all') =>
            this.request<import('@/types').StockAlert[]>(`/alerts/${locationId}`),
    };

    // 商品マスタ（バックエンドは /items を使用）
    products = {
        list: (page = 1, pageSize = 20) =>
            this.request<import('@/types').PaginatedResponse<import('@/types').Product>>(`/items?offset=${(page - 1) * pageSize}&limit=${pageSize}`),
        get: (id: string) => this.request<import('@/types').Product>(`/items/${id}`),
        create: (data: Partial<import('@/types').Product>) =>
            this.request<import('@/types').Product>('/items', { method: 'POST', body: data }),
        update: (id: string, data: Partial<import('@/types').Product>) =>
            this.request<import('@/types').Product>(`/items/${id}`, { method: 'PUT', body: data }),
        delete: (id: string) => this.request(`/items/${id}`, { method: 'DELETE' }),
    };

    // ロケーションマスタ
    locations = {
        list: (page = 1, pageSize = 20) =>
            this.request<import('@/types').PaginatedResponse<import('@/types').Location>>(`/locations?offset=${(page - 1) * pageSize}&limit=${pageSize}`),
        get: (id: string) => this.request<import('@/types').Location>(`/locations/${id}`),
        create: (data: Partial<import('@/types').Location>) =>
            this.request<import('@/types').Location>('/locations', { method: 'POST', body: data }),
        update: (id: string, data: Partial<import('@/types').Location>) =>
            this.request<import('@/types').Location>(`/locations/${id}`, { method: 'PUT', body: data }),
        delete: (id: string) => this.request(`/locations/${id}`, { method: 'DELETE' }),
    };

    // 棚卸関連
    stocktaking = {
        list: (status?: import('@/types').StocktakingStatus) =>
            this.request<import('@/types').Stocktaking[]>(`/stocktaking${status ? `?status=${status}` : ''}`),
        get: (id: string) => this.request<import('@/types').Stocktaking>(`/stocktaking/${id}`),
        create: (data: { locationId: string; scheduledDate: string }) =>
            this.request<import('@/types').Stocktaking>('/stocktaking', { method: 'POST', body: data }),
        updateItem: (stocktakingId: string, itemId: string, actualQuantity: number, note?: string) =>
            this.request(`/stocktaking/${stocktakingId}/items/${itemId}`, {
                method: 'PUT',
                body: { actualQuantity, note },
            }),
        approve: (id: string) =>
            this.request(`/stocktaking/${id}/approve`, { method: 'POST' }),
        reject: (id: string, reason: string) =>
            this.request(`/stocktaking/${id}/reject`, { method: 'POST', body: { reason } }),
    };

    // ロット関連
    lots = {
        getByItem: (itemId: string) =>
            this.request<import('@/types').Lot[]>(`/lots/item/${itemId}`),
        get: (lotId: string) =>
            this.request<import('@/types').Lot>(`/lots/${lotId}`),
        getExpiring: (days = 14) =>
            this.request<import('@/types').Lot[]>(`/lots/expiring?days=${days}`),
        getExpired: () =>
            this.request<import('@/types').Lot[]>('/lots/expired'),
        getHistory: (lotNumber: string) =>
            this.request<import('@/types').Transaction[]>(`/lots/${lotNumber}/history`),
    };

    // ユーザー管理
    users = {
        list: (page = 1, pageSize = 20) =>
            this.request<import('@/types').PaginatedResponse<import('@/types').User>>(`/users?offset=${(page - 1) * pageSize}&limit=${pageSize}`),
        get: (id: string) =>
            this.request<import('@/types').User>(`/users/${id}`),
        create: (data: import('@/types').CreateUserRequest) =>
            this.request<import('@/types').User>('/users', { method: 'POST', body: data }),
        update: (id: string, data: import('@/types').UpdateUserRequest) =>
            this.request<import('@/types').User>(`/users/${id}`, { method: 'PUT', body: data }),
        delete: (id: string) =>
            this.request(`/users/${id}`, { method: 'DELETE' }),
    };

    // ロール管理
    roles = {
        list: () =>
            this.request<import('@/types').RoleInfo[]>('/roles'),
    };

    // 監査ログ
    audit = {
        list: (params: { userId?: string; action?: string; from?: string; to?: string; page?: number; pageSize?: number }) =>
            this.request<import('@/types').PaginatedResponse<import('@/types').AuditLog>>(
                `/audit?${new URLSearchParams(params as Record<string, string>).toString()}`
            ),
        exportCsv: (params: { userId?: string; action?: string; from?: string; to?: string }) =>
            `${this.baseUrl}/audit/export?${new URLSearchParams(params as Record<string, string>).toString()}`,
    };
}

export const api = new ApiClient(API_BASE_URL);
