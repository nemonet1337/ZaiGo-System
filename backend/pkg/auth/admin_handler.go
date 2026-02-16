package auth

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// ================================================
// ユーザー管理ハンドラー
// ================================================

// CreateUserRequest はユーザー作成リクエスト
type CreateUserRequest struct {
	Email      string  `json:"email"`
	Name       string  `json:"name"`
	Password   string  `json:"password"`
	Role       Role    `json:"role"`
	LocationID *string `json:"location_id,omitempty"`
}

// UpdateUserRequest はユーザー更新リクエスト
type UpdateUserRequest struct {
	Name       *string `json:"name,omitempty"`
	Email      *string `json:"email,omitempty"`
	Role       *Role   `json:"role,omitempty"`
	LocationID *string `json:"location_id,omitempty"`
	IsActive   *bool   `json:"is_active,omitempty"`
}

// UserListResponse はユーザー一覧レスポンス
type UserListResponse struct {
	Items []UserDTO `json:"items"`
	Total int       `json:"total"`
}

// ListUsers はユーザー一覧を返す
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	users, err := h.userRepo.List(r.Context(), offset, limit)
	if err != nil {
		h.sendError(w, "ユーザー一覧の取得に失敗しました", http.StatusInternalServerError)
		return
	}

	dtos := make([]UserDTO, 0, len(users))
	for _, u := range users {
		dtos = append(dtos, UserDTO{
			ID:         u.ID,
			Email:      u.Email,
			Name:       u.Name,
			Role:       u.Role,
			LocationID: u.LocationID,
			IsActive:   u.IsActive,
		})
	}

	h.sendJSON(w, UserListResponse{
		Items: dtos,
		Total: len(dtos),
	})
}

// CreateUser は新規ユーザーを作成する
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "リクエストの解析に失敗しました", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Name == "" || req.Password == "" {
		h.sendError(w, "メール、名前、パスワードは必須です", http.StatusBadRequest)
		return
	}

	user, err := NewUser(req.Email, req.Name, req.Password, req.Role)
	if err != nil {
		h.sendError(w, "ユーザーの作成に失敗しました", http.StatusInternalServerError)
		return
	}
	user.LocationID = req.LocationID

	if err := h.userRepo.Create(r.Context(), user); err != nil {
		if err == ErrDuplicateEmail {
			h.sendError(w, "このメールアドレスは既に使用されています", http.StatusConflict)
			return
		}
		h.sendError(w, "ユーザーの保存に失敗しました", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	h.sendJSON(w, UserDTO{
		ID:         user.ID,
		Email:      user.Email,
		Name:       user.Name,
		Role:       user.Role,
		LocationID: user.LocationID,
		IsActive:   user.IsActive,
	})
}

// UpdateUser はユーザー情報を更新する
func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		if err == ErrUserNotFound {
			h.sendError(w, "ユーザーが見つかりません", http.StatusNotFound)
			return
		}
		h.sendError(w, "ユーザーの取得に失敗しました", http.StatusInternalServerError)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "リクエストの解析に失敗しました", http.StatusBadRequest)
		return
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.LocationID != nil {
		user.LocationID = req.LocationID
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(r.Context(), user); err != nil {
		h.sendError(w, "ユーザーの更新に失敗しました", http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, UserDTO{
		ID:         user.ID,
		Email:      user.Email,
		Name:       user.Name,
		Role:       user.Role,
		LocationID: user.LocationID,
		IsActive:   user.IsActive,
	})
}

// DeleteUser はユーザーを削除する
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]

	if err := h.userRepo.Delete(r.Context(), userID); err != nil {
		if err == ErrUserNotFound {
			h.sendError(w, "ユーザーが見つかりません", http.StatusNotFound)
			return
		}
		h.sendError(w, "ユーザーの削除に失敗しました", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetUser はユーザー詳細を返す
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userId"]

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		if err == ErrUserNotFound {
			h.sendError(w, "ユーザーが見つかりません", http.StatusNotFound)
			return
		}
		h.sendError(w, "ユーザーの取得に失敗しました", http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, UserDTO{
		ID:         user.ID,
		Email:      user.Email,
		Name:       user.Name,
		Role:       user.Role,
		LocationID: user.LocationID,
		IsActive:   user.IsActive,
	})
}

// ================================================
// ロール管理ハンドラー
// ================================================

// RoleInfo はロール情報
type RoleInfo struct {
	Role        Role         `json:"role"`
	Label       string       `json:"label"`
	Description string       `json:"description"`
	Permissions []Permission `json:"permissions"`
}

var roleLabels = map[Role]string{
	RoleSystemAdmin:      "システム管理者",
	RoleInventoryManager: "在庫管理者",
	RoleFieldOperator:    "現場担当者",
	RoleAnalyst:          "アナリスト",
	RoleViewer:           "閲覧者",
}

var roleDescriptions = map[Role]string{
	RoleSystemAdmin:      "全機能へのフルアクセス。ユーザー・ロール管理、監査ログ閲覧を含む。",
	RoleInventoryManager: "在庫管理業務全般。マスタ編集、棚卸承認、レポート閲覧が可能。",
	RoleFieldOperator:    "入出庫登録、棚卸入力など現場業務に必要な操作が可能。",
	RoleAnalyst:          "在庫データとレポートの参照・分析が可能。データ変更は不可。",
	RoleViewer:           "在庫情報とマスタの参照のみ可能。",
}

// ListRoles はロール一覧を返す
func (h *Handler) ListRoles(w http.ResponseWriter, r *http.Request) {
	roles := []Role{
		RoleSystemAdmin,
		RoleInventoryManager,
		RoleFieldOperator,
		RoleAnalyst,
		RoleViewer,
	}

	result := make([]RoleInfo, 0, len(roles))
	for _, role := range roles {
		result = append(result, RoleInfo{
			Role:        role,
			Label:       roleLabels[role],
			Description: roleDescriptions[role],
			Permissions: RolePermissions[role],
		})
	}

	h.sendJSON(w, result)
}

// ================================================
// 監査ログハンドラー
// ================================================

// AuditLogEntry は監査ログエントリ
type AuditLogEntry struct {
	ID         string                 `json:"id"`
	UserID     string                 `json:"userId"`
	UserName   string                 `json:"userName,omitempty"`
	Action     string                 `json:"action"`
	EntityType string                 `json:"entityType"`
	EntityID   string                 `json:"entityId"`
	Details    map[string]interface{} `json:"details"`
	IPAddress  string                 `json:"ipAddress"`
	CreatedAt  time.Time              `json:"createdAt"`
}

// AuditLogListResponse は監査ログ一覧レスポンス
type AuditLogListResponse struct {
	Items []AuditLogEntry `json:"items"`
	Total int             `json:"total"`
}

// ListAuditLogs は監査ログ一覧を返す（開発用スタブ）
func (h *Handler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	// 開発用: サンプルデータを返す
	// 本番ではデータベースから取得する
	sampleLogs := []AuditLogEntry{
		{
			ID:         uuid.New().String(),
			UserID:     "admin-001",
			UserName:   "管理者",
			Action:     "LOGIN",
			EntityType: "user",
			EntityID:   "admin-001",
			Details:    map[string]interface{}{"method": "password"},
			IPAddress:  "192.168.1.100",
			CreatedAt:  time.Now().Add(-1 * time.Hour),
		},
		{
			ID:         uuid.New().String(),
			UserID:     "admin-001",
			UserName:   "管理者",
			Action:     "CREATE",
			EntityType: "product",
			EntityID:   uuid.New().String(),
			Details:    map[string]interface{}{"sku": "SKU-001", "name": "サンプル商品"},
			IPAddress:  "192.168.1.100",
			CreatedAt:  time.Now().Add(-30 * time.Minute),
		},
		{
			ID:         uuid.New().String(),
			UserID:     "user-001",
			UserName:   "田中太郎",
			Action:     "UPDATE",
			EntityType: "inventory",
			EntityID:   uuid.New().String(),
			Details:    map[string]interface{}{"quantity_change": 50, "type": "inbound"},
			IPAddress:  "192.168.1.101",
			CreatedAt:  time.Now().Add(-15 * time.Minute),
		},
	}

	h.sendJSON(w, AuditLogListResponse{
		Items: sampleLogs,
		Total: len(sampleLogs),
	})
}

// ExportAuditLogs は監査ログをCSVとしてエクスポートする（スタブ）
func (h *Handler) ExportAuditLogs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=audit_logs.csv")

	// BOM付きUTF-8
	w.Write([]byte{0xEF, 0xBB, 0xBF})
	w.Write([]byte("ID,ユーザー,アクション,対象タイプ,対象ID,IPアドレス,日時\n"))
	w.Write([]byte("sample-001,管理者,LOGIN,user,admin-001,192.168.1.100,2026-01-01 00:00:00\n"))
}
