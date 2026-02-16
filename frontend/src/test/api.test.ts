import { describe, it, expect, vi, beforeEach } from 'vitest';

// fetchをモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// モジュールをリセットするために動的インポート
let api: typeof import('@/lib/api').api;

beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();

    // 環境変数をセット
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api/v1';

    const module = await import('@/lib/api');
    api = module.api;
});

describe('ApiClient', () => {
    describe('inventory', () => {
        it('getStock should call correct endpoint', async () => {
            const mockStock = {
                item_id: 'item-1',
                location_id: 'loc-1',
                quantity: 100,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockStock,
            });

            const result = await api.inventory.getStock('item-1', 'loc-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/inventory/item-1/loc-1',
                expect.objectContaining({
                    method: 'GET',
                })
            );
            expect(result).toEqual(mockStock);
        });

        it('add should send snake_case body', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            await api.inventory.add({
                itemId: 'item-1',
                locationId: 'loc-1',
                quantity: 50,
                reference: 'TEST-REF',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/inventory/add',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        item_id: 'item-1',
                        location_id: 'loc-1',
                        quantity: 50,
                        reference: 'TEST-REF',
                    }),
                })
            );
        });

        it('transfer should send snake_case body with from/to locations', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            await api.inventory.transfer({
                itemId: 'item-1',
                fromLocationId: 'loc-A',
                toLocationId: 'loc-B',
                quantity: 30,
                reference: 'TRANSFER-REF',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/inventory/transfer',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        item_id: 'item-1',
                        from_location_id: 'loc-A',
                        to_location_id: 'loc-B',
                        quantity: 30,
                        reference: 'TRANSFER-REF',
                    }),
                })
            );
        });
    });

    describe('products', () => {
        it('list should call /items endpoint with pagination', async () => {
            const mockItems = { items: [], count: 0 };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockItems,
            });

            await api.products.list(2, 10);

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/items?offset=10&limit=10',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        it('get should call /items/{id} endpoint', async () => {
            const mockItem = { id: 'item-1', name: 'Test Item' };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockItem,
            });

            await api.products.get('item-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/items/item-1',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });
    });

    describe('locations', () => {
        it('list should call /locations endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ locations: [] }),
            });

            await api.locations.list();

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/locations?offset=0&limit=20',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });
    });

    describe('lots', () => {
        it('getByItem should call /lots/item/{itemId}', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            });

            await api.lots.getByItem('item-1');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/lots/item/item-1',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });
    });

    describe('auth', () => {
        it('login should post credentials', async () => {
            const mockResponse = {
                user: { id: 'user-1', email: 'test@example.com' },
                token: 'jwt-token',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            await api.auth.login('test@example.com', 'password');

            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:8080/api/v1/auth/login',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        email: 'test@example.com',
                        password: 'password',
                    }),
                })
            );
        });
    });

    describe('error handling', () => {
        it('should throw error on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ message: 'Internal Server Error' }),
            });

            await expect(api.inventory.getStock('item-1', 'loc-1')).rejects.toThrow(
                'Internal Server Error'
            );
        });
    });
});
