package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"go.uber.org/zap"

	"github.com/nemonet1337/zaiGoFramework/internal/config"
	"github.com/nemonet1337/zaiGoFramework/pkg/auth"
	"github.com/nemonet1337/zaiGoFramework/pkg/inventory"
	"github.com/nemonet1337/zaiGoFramework/pkg/inventory/storage"
)

func main() {
	// ログ設定
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal("ログ初期化に失敗しました:", err)
	}
	defer logger.Sync()

	// 設定読み込み
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("設定読み込みに失敗しました", zap.Error(err))
	}

	// データベース接続
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
	)

	storage, err := storage.NewPostgreSQLStorage(dsn, logger)
	if err != nil {
		logger.Fatal("データベース接続に失敗しました", zap.Error(err))
	}
	defer storage.Close()

	// 在庫マネージャー初期化
	inventoryConfig := &inventory.Config{
		AllowNegativeStock: cfg.Inventory.AllowNegativeStock,
		DefaultLocation:    cfg.Inventory.DefaultLocation,
		AuditEnabled:       cfg.Inventory.AuditEnabled,
		LowStockThreshold:  cfg.Inventory.LowStockThreshold,
		AlertTimeout:       time.Duration(cfg.Inventory.AlertTimeoutHours) * time.Hour,
	}

	manager := inventory.NewManager(storage, nil, logger, inventoryConfig)

	// 認証サービス初期化
	jwtConfig := auth.DefaultConfig()
	jwtService := auth.NewJWTService(jwtConfig)
	userRepo := auth.NewInMemoryUserRepository()
	authHandler := auth.NewHandler(userRepo, jwtService, logger)
	authMiddleware := auth.NewMiddleware(jwtService, logger)

	// HTTPハンドラー設定
	handlers := NewHandlers(manager, logger)
	router := setupRouter(handlers, authHandler, authMiddleware)

	// HTTPサーバー設定
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.API.Port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// グレースフルシャットダウン設定
	go func() {
		logger.Info("在庫管理APIサーバーを開始します", zap.Int("port", cfg.API.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("サーバー開始に失敗しました", zap.Error(err))
		}
	}()

	// シャットダウンシグナル待機
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("サーバーをシャットダウンしています...")

	// グレースフルシャットダウン
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("サーバーシャットダウンに失敗しました", zap.Error(err))
	}

	logger.Info("サーバーが正常に停止しました")
}

// setupRouter sets up HTTP routes
// HTTPルートを設定
func setupRouter(handlers *Handlers, authHandler *auth.Handler, authMiddleware *auth.Middleware) *mux.Router {
	router := mux.NewRouter()

	// ヘルスチェック
	router.HandleFunc("/health", handlers.HealthCheck).Methods("GET")
	router.HandleFunc("/metrics", handlers.Metrics).Methods("GET")

	// API v1ルート
	api := router.PathPrefix("/api/v1").Subrouter()

	// 認証API（認証不要）
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST")
	api.HandleFunc("/auth/refresh", authHandler.Refresh).Methods("POST")

	// 認証が必要なエンドポイント
	protectedApi := api.PathPrefix("").Subrouter()
	protectedApi.Use(authMiddleware.Authenticate)

	protectedApi.HandleFunc("/auth/me", authHandler.Me).Methods("GET")

	// 在庫操作（認証必須）
	protectedApi.HandleFunc("/inventory/add", handlers.AddStock).Methods("POST")
	protectedApi.HandleFunc("/inventory/remove", handlers.RemoveStock).Methods("POST")
	protectedApi.HandleFunc("/inventory/transfer", handlers.TransferStock).Methods("POST")
	protectedApi.HandleFunc("/inventory/adjust", handlers.AdjustStock).Methods("POST")
	protectedApi.HandleFunc("/inventory/batch", handlers.BatchOperation).Methods("POST")

	// 在庫照会（認証必須）
	protectedApi.HandleFunc("/inventory/{itemId}/{locationId}", handlers.GetStock).Methods("GET")
	protectedApi.HandleFunc("/inventory/{itemId}/total", handlers.GetTotalStock).Methods("GET")
	protectedApi.HandleFunc("/inventory/location/{locationId}", handlers.GetStockByLocation).Methods("GET")

	// 履歴（認証必須）
	protectedApi.HandleFunc("/inventory/{itemId}/history", handlers.GetHistory).Methods("GET")
	protectedApi.HandleFunc("/inventory/history/location/{locationId}", handlers.GetHistoryByLocation).Methods("GET")
	protectedApi.HandleFunc("/inventory/{itemId}/history/date-range", handlers.GetHistoryByDateRange).Methods("GET")

	// アラート（認証必須）
	protectedApi.HandleFunc("/alerts/{locationId}", handlers.GetAlerts).Methods("GET")
	protectedApi.HandleFunc("/alerts/{alertId}/resolve", handlers.ResolveAlert).Methods("POST")

	// 商品管理（認証必須）
	protectedApi.HandleFunc("/items", handlers.CreateItem).Methods("POST")
	protectedApi.HandleFunc("/items", handlers.ListItems).Methods("GET")
	protectedApi.HandleFunc("/items/search", handlers.SearchItems).Methods("GET")
	protectedApi.HandleFunc("/items/{itemId}", handlers.GetItem).Methods("GET")
	protectedApi.HandleFunc("/items/{itemId}", handlers.UpdateItem).Methods("PUT")
	protectedApi.HandleFunc("/items/{itemId}", handlers.DeleteItem).Methods("DELETE")

	// ロケーション管理（認証必須）
	protectedApi.HandleFunc("/locations", handlers.CreateLocation).Methods("POST")
	protectedApi.HandleFunc("/locations", handlers.ListLocations).Methods("GET")
	protectedApi.HandleFunc("/locations/{locationId}", handlers.GetLocation).Methods("GET")
	protectedApi.HandleFunc("/locations/{locationId}", handlers.UpdateLocation).Methods("PUT")
	protectedApi.HandleFunc("/locations/{locationId}", handlers.DeleteLocation).Methods("DELETE")

	// ロット管理（認証必須）
	protectedApi.HandleFunc("/lots", handlers.CreateLot).Methods("POST")
	protectedApi.HandleFunc("/lots/{lotId}", handlers.GetLot).Methods("GET")
	protectedApi.HandleFunc("/lots/item/{itemId}", handlers.GetLotsByItem).Methods("GET")
	protectedApi.HandleFunc("/lots/expiring", handlers.GetExpiringLots).Methods("GET")
	protectedApi.HandleFunc("/lots/expired", handlers.GetExpiredLots).Methods("GET")

	// 予約管理（認証必須）
	protectedApi.HandleFunc("/inventory/reserve", handlers.ReserveStock).Methods("POST")
	protectedApi.HandleFunc("/inventory/release-reservation", handlers.ReleaseReservation).Methods("POST")

	// バッチ管理（認証必須）
	protectedApi.HandleFunc("/inventory/batch/{batchId}/status", handlers.GetBatchStatus).Methods("GET")

	// 在庫評価エンジン（認証必須）
	protectedApi.HandleFunc("/valuation/{itemId}/{locationId}", handlers.CalculateValue).Methods("GET")
	protectedApi.HandleFunc("/valuation/total/{locationId}", handlers.CalculateTotalValue).Methods("GET")
	protectedApi.HandleFunc("/valuation/average-cost/{itemId}", handlers.GetAverageCost).Methods("GET")

	// 在庫分析エンジン（認証必須）
	protectedApi.HandleFunc("/analytics/abc/{locationId}", handlers.CalculateABCClassification).Methods("GET")
	protectedApi.HandleFunc("/analytics/turnover/{itemId}", handlers.GetTurnoverRate).Methods("GET")
	protectedApi.HandleFunc("/analytics/slow-moving/{locationId}", handlers.GetSlowMovingItems).Methods("GET")
	protectedApi.HandleFunc("/analytics/report/{locationId}", handlers.GenerateStockReport).Methods("GET")

	// CORS設定（開発用）
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// ログ機能
	router.Use(loggingMiddleware(handlers.logger))

	return router
}

// loggingMiddleware logs HTTP requests
// HTTPリクエストをログ出力するミドルウェア
func loggingMiddleware(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// リクエスト処理
			next.ServeHTTP(w, r)

			// ログ出力
			logger.Info("HTTPリクエスト",
				zap.String("method", r.Method),
				zap.String("url", r.URL.Path),
				zap.String("remote_addr", r.RemoteAddr),
				zap.Duration("duration", time.Since(start)),
			)
		})
	}
}
