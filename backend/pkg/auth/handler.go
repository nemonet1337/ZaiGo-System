package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// Handler は認証APIハンドラー
type Handler struct {
	userRepo   UserRepository
	jwtService *JWTService
	logger     *zap.Logger
}

// NewHandler は新しい認証ハンドラーを作成
func NewHandler(userRepo UserRepository, jwtService *JWTService, logger *zap.Logger) *Handler {
	return &Handler{
		userRepo:   userRepo,
		jwtService: jwtService,
		logger:     logger,
	}
}

// LoginRequest はログインリクエスト
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse はログインレスポンス
type LoginResponse struct {
	Success bool       `json:"success"`
	User    *UserDTO   `json:"user,omitempty"`
	Token   *TokenPair `json:"token,omitempty"`
	Error   string     `json:"error,omitempty"`
}

// UserDTO はユーザーDTO
type UserDTO struct {
	ID         string  `json:"id"`
	Email      string  `json:"email"`
	Name       string  `json:"name"`
	Role       Role    `json:"role"`
	LocationID *string `json:"location_id,omitempty"`
	IsActive   bool    `json:"is_active"`
}

// Login はログインを処理
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// バリデーション
	if req.Email == "" || req.Password == "" {
		h.sendError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// ユーザー取得
	ctx := r.Context()
	user, err := h.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		h.logger.Debug("User not found", zap.String("email", req.Email))
		h.sendError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// パスワード検証
	if !user.CheckPassword(req.Password) {
		h.logger.Debug("Invalid password", zap.String("email", req.Email))
		h.sendError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// アカウント有効性チェック
	if !user.IsActive {
		h.sendError(w, "Account is disabled", http.StatusForbidden)
		return
	}

	// トークン生成
	tokens, err := h.jwtService.GenerateTokens(user)
	if err != nil {
		h.logger.Error("Failed to generate tokens", zap.Error(err))
		h.sendError(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// リフレッシュトークンをCookieに設定
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    tokens.RefreshToken,
		Path:     "/api/v1/auth",
		HttpOnly: true,
		Secure:   false, // 本番ではtrue
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(7 * 24 * time.Hour / time.Second),
	})

	// アクセストークンもCookieに設定（オプション）
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // 本番ではtrue
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(15 * time.Minute / time.Second),
	})

	h.logger.Info("User logged in", zap.String("user_id", user.ID), zap.String("email", user.Email))

	h.sendJSON(w, LoginResponse{
		Success: true,
		User: &UserDTO{
			ID:         user.ID,
			Email:      user.Email,
			Name:       user.Name,
			Role:       user.Role,
			LocationID: user.LocationID,
			IsActive:   user.IsActive,
		},
		Token: tokens,
	})
}

// Logout はログアウトを処理
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// Cookieをクリア
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		HttpOnly: true,
		MaxAge:   -1,
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	h.sendJSON(w, map[string]interface{}{
		"success": true,
		"message": "Logged out successfully",
	})
}

// Me は現在のユーザー情報を返す
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	claims := GetClaimsFromContext(r.Context())
	if claims == nil {
		h.sendError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// ユーザー情報を取得
	user, err := h.userRepo.GetByID(r.Context(), claims.UserID)
	if err != nil {
		h.sendError(w, "User not found", http.StatusNotFound)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"success": true,
		"data": UserDTO{
			ID:         user.ID,
			Email:      user.Email,
			Name:       user.Name,
			Role:       user.Role,
			LocationID: user.LocationID,
			IsActive:   user.IsActive,
		},
	})
}

// Refresh はトークンをリフレッシュ
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	// Cookieからリフレッシュトークン取得
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		h.sendError(w, "No refresh token", http.StatusUnauthorized)
		return
	}

	// リフレッシュトークン検証
	userID, err := h.jwtService.ValidateRefreshToken(cookie.Value)
	if err != nil {
		h.sendError(w, "Invalid refresh token", http.StatusUnauthorized)
		return
	}

	// ユーザー取得
	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		h.sendError(w, "User not found", http.StatusUnauthorized)
		return
	}

	if !user.IsActive {
		h.sendError(w, "Account is disabled", http.StatusForbidden)
		return
	}

	// 新しいトークン生成
	tokens, err := h.jwtService.GenerateTokens(user)
	if err != nil {
		h.sendError(w, "Failed to generate tokens", http.StatusInternalServerError)
		return
	}

	// Cookieを更新
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    tokens.AccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(15 * time.Minute / time.Second),
	})

	h.sendJSON(w, map[string]interface{}{
		"success":      true,
		"access_token": tokens.AccessToken,
		"expires_at":   tokens.ExpiresAt,
	})
}

func (h *Handler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) sendError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   message,
	})
}

// InMemoryUserRepository はメモリ上のユーザーリポジトリ（開発用）
type InMemoryUserRepository struct {
	users map[string]*User
}

// NewInMemoryUserRepository は新しいメモリリポジトリを作成
func NewInMemoryUserRepository() *InMemoryUserRepository {
	repo := &InMemoryUserRepository{
		users: make(map[string]*User),
	}

	// デフォルトの管理者ユーザーを追加
	admin, _ := NewUser("admin@zaigo.local", "管理者", "admin123", RoleSystemAdmin)
	repo.users[admin.ID] = admin
	repo.users[admin.Email] = admin // メールでも検索できるように

	return repo
}

func (r *InMemoryUserRepository) Create(ctx context.Context, user *User) error {
	if _, exists := r.users[user.Email]; exists {
		return ErrDuplicateEmail
	}
	r.users[user.ID] = user
	r.users[user.Email] = user
	return nil
}

func (r *InMemoryUserRepository) GetByID(ctx context.Context, id string) (*User, error) {
	user, exists := r.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (r *InMemoryUserRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	user, exists := r.users[email]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (r *InMemoryUserRepository) Update(ctx context.Context, user *User) error {
	if _, exists := r.users[user.ID]; !exists {
		return ErrUserNotFound
	}
	r.users[user.ID] = user
	r.users[user.Email] = user
	return nil
}

func (r *InMemoryUserRepository) Delete(ctx context.Context, id string) error {
	user, exists := r.users[id]
	if !exists {
		return ErrUserNotFound
	}
	delete(r.users, user.ID)
	delete(r.users, user.Email)
	return nil
}

func (r *InMemoryUserRepository) List(ctx context.Context, offset, limit int) ([]User, error) {
	var users []User
	seen := make(map[string]bool)
	for _, user := range r.users {
		if seen[user.ID] {
			continue
		}
		seen[user.ID] = true
		users = append(users, *user)
	}

	// ページネーション
	if offset >= len(users) {
		return []User{}, nil
	}
	end := offset + limit
	if end > len(users) {
		end = len(users)
	}
	return users[offset:end], nil
}
