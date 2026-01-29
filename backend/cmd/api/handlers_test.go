package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"

	"github.com/nemonet1337/zaiGoFramework/pkg/inventory"
)

// MockInventoryManager はテスト用のモックマネージャー
type MockInventoryManager struct {
	mock.Mock
}

func (m *MockInventoryManager) Add(ctx context.Context, itemID, locationID string, quantity int64, reference string) error {
	args := m.Called(ctx, itemID, locationID, quantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) Remove(ctx context.Context, itemID, locationID string, quantity int64, reference string) error {
	args := m.Called(ctx, itemID, locationID, quantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) Transfer(ctx context.Context, itemID, fromLocationID, toLocationID string, quantity int64, reference string) error {
	args := m.Called(ctx, itemID, fromLocationID, toLocationID, quantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) Adjust(ctx context.Context, itemID, locationID string, newQuantity int64, reference string) error {
	args := m.Called(ctx, itemID, locationID, newQuantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) GetStock(ctx context.Context, itemID, locationID string) (*inventory.Stock, error) {
	args := m.Called(ctx, itemID, locationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.Stock), args.Error(1)
}

func (m *MockInventoryManager) GetTotalStock(ctx context.Context, itemID string) (int64, error) {
	args := m.Called(ctx, itemID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockInventoryManager) GetStockByLocation(ctx context.Context, locationID string) ([]inventory.Stock, error) {
	args := m.Called(ctx, locationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]inventory.Stock), args.Error(1)
}

func (m *MockInventoryManager) GetHistory(ctx context.Context, itemID string, limit int) ([]inventory.Transaction, error) {
	args := m.Called(ctx, itemID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]inventory.Transaction), args.Error(1)
}

func (m *MockInventoryManager) GetHistoryByLocation(ctx context.Context, locationID string, limit int) ([]inventory.Transaction, error) {
	args := m.Called(ctx, locationID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]inventory.Transaction), args.Error(1)
}

func (m *MockInventoryManager) GetHistoryByDateRange(ctx context.Context, itemID string, from, to time.Time) ([]inventory.Transaction, error) {
	args := m.Called(ctx, itemID, from, to)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]inventory.Transaction), args.Error(1)
}

func (m *MockInventoryManager) ExecuteBatch(ctx context.Context, operations []inventory.InventoryOperation) (*inventory.BatchOperation, error) {
	args := m.Called(ctx, operations)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.BatchOperation), args.Error(1)
}

func (m *MockInventoryManager) GetBatchStatus(ctx context.Context, batchID string) (*inventory.BatchOperation, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.BatchOperation), args.Error(1)
}

func (m *MockInventoryManager) Reserve(ctx context.Context, itemID, locationID string, quantity int64, reference string) error {
	args := m.Called(ctx, itemID, locationID, quantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) ReleaseReservation(ctx context.Context, itemID, locationID string, quantity int64, reference string) error {
	args := m.Called(ctx, itemID, locationID, quantity, reference)
	return args.Error(0)
}

func (m *MockInventoryManager) GetAlerts(ctx context.Context, locationID string) ([]inventory.StockAlert, error) {
	args := m.Called(ctx, locationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]inventory.StockAlert), args.Error(1)
}

func (m *MockInventoryManager) ResolveAlert(ctx context.Context, alertID string) error {
	args := m.Called(ctx, alertID)
	return args.Error(0)
}

// テストヘルパー関数
func setupTestHandler() (*Handlers, *MockInventoryManager) {
	mockManager := new(MockInventoryManager)
	logger, _ := zap.NewDevelopment()
	handlers := NewHandlers(mockManager, logger)
	return handlers, mockManager
}

// =====================
// ヘルスチェックテスト
// =====================

func TestHealthCheck(t *testing.T) {
	handlers, _ := setupTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	handlers.HealthCheck(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response APIResponse
	err := json.NewDecoder(rec.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response.Success)
	assert.NotNil(t, response.Data)
}

// =====================
// 在庫追加テスト
// =====================

func TestAddStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("Add", mock.Anything, "item-1", "loc-1", int64(100), "TEST-REF").Return(nil)

	reqBody := AddStockRequest{
		ItemID:     "item-1",
		LocationID: "loc-1",
		Quantity:   100,
		Reference:  "TEST-REF",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/add", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.AddStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response APIResponse
	err := json.NewDecoder(rec.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	mockManager.AssertExpectations(t)
}

func TestAddStock_InvalidRequest(t *testing.T) {
	handlers, _ := setupTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/add", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.AddStock(rec, req)

	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

// =====================
// 在庫削除テスト
// =====================

func TestRemoveStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("Remove", mock.Anything, "item-1", "loc-1", int64(50), "REMOVE-REF").Return(nil)

	reqBody := RemoveStockRequest{
		ItemID:     "item-1",
		LocationID: "loc-1",
		Quantity:   50,
		Reference:  "REMOVE-REF",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/remove", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.RemoveStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	mockManager.AssertExpectations(t)
}

func TestRemoveStock_InsufficientStock(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("Remove", mock.Anything, "item-1", "loc-1", int64(1000), "REMOVE-REF").Return(inventory.ErrInsufficientStock)

	reqBody := RemoveStockRequest{
		ItemID:     "item-1",
		LocationID: "loc-1",
		Quantity:   1000,
		Reference:  "REMOVE-REF",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/remove", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.RemoveStock(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	mockManager.AssertExpectations(t)
}

// =====================
// 在庫移動テスト
// =====================

func TestTransferStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("Transfer", mock.Anything, "item-1", "loc-A", "loc-B", int64(30), "TRANSFER-REF").Return(nil)

	reqBody := TransferStockRequest{
		ItemID:         "item-1",
		FromLocationID: "loc-A",
		ToLocationID:   "loc-B",
		Quantity:       30,
		Reference:      "TRANSFER-REF",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/transfer", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.TransferStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	mockManager.AssertExpectations(t)
}

// =====================
// 在庫調整テスト
// =====================

func TestAdjustStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("Adjust", mock.Anything, "item-1", "loc-1", int64(200), "ADJUST-REF").Return(nil)

	reqBody := AdjustStockRequest{
		ItemID:      "item-1",
		LocationID:  "loc-1",
		NewQuantity: 200,
		Reference:   "ADJUST-REF",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/inventory/adjust", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handlers.AdjustStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	mockManager.AssertExpectations(t)
}

// =====================
// 在庫取得テスト
// =====================

func TestGetStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	expectedStock := &inventory.Stock{
		ItemID:     "item-1",
		LocationID: "loc-1",
		Quantity:   150,
	}

	mockManager.On("GetStock", mock.Anything, "item-1", "loc-1").Return(expectedStock, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/item-1/loc-1", nil)
	req = mux.SetURLVars(req, map[string]string{
		"itemId":     "item-1",
		"locationId": "loc-1",
	})
	rec := httptest.NewRecorder()

	handlers.GetStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	mockManager.AssertExpectations(t)
}

func TestGetStock_NotFound(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("GetStock", mock.Anything, "item-999", "loc-1").Return(nil, inventory.ErrStockNotFound)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/item-999/loc-1", nil)
	req = mux.SetURLVars(req, map[string]string{
		"itemId":     "item-999",
		"locationId": "loc-1",
	})
	rec := httptest.NewRecorder()

	handlers.GetStock(rec, req)

	assert.Equal(t, http.StatusNotFound, rec.Code)
	mockManager.AssertExpectations(t)
}

// =====================
// 総在庫取得テスト
// =====================

func TestGetTotalStock_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	mockManager.On("GetTotalStock", mock.Anything, "item-1").Return(int64(500), nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/inventory/item-1/total", nil)
	req = mux.SetURLVars(req, map[string]string{
		"itemId": "item-1",
	})
	rec := httptest.NewRecorder()

	handlers.GetTotalStock(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response APIResponse
	err := json.NewDecoder(rec.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response.Success)

	mockManager.AssertExpectations(t)
}

// =====================
// アラート取得テスト
// =====================

func TestGetAlerts_Success(t *testing.T) {
	handlers, mockManager := setupTestHandler()

	expectedAlerts := []inventory.StockAlert{
		{
			ID:         "alert-1",
			ItemID:     "item-1",
			LocationID: "loc-1",
			Type:       "LOW_STOCK",
		},
	}

	mockManager.On("GetAlerts", mock.Anything, "loc-1").Return(expectedAlerts, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/alerts/loc-1", nil)
	req = mux.SetURLVars(req, map[string]string{
		"locationId": "loc-1",
	})
	rec := httptest.NewRecorder()

	handlers.GetAlerts(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	mockManager.AssertExpectations(t)
}
