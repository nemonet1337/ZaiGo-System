package auth

import (
	"context"
	"net/http"
	"strings"

	"go.uber.org/zap"
)

// contextKey はコンテキストキーの型
type contextKey string

const (
	// UserContextKey はユーザー情報のコンテキストキー
	UserContextKey contextKey = "user"
	// ClaimsContextKey はクレーム情報のコンテキストキー
	ClaimsContextKey contextKey = "claims"
)

// Middleware は認証ミドルウェア
type Middleware struct {
	jwtService *JWTService
	logger     *zap.Logger
}

// NewMiddleware は新しい認証ミドルウェアを作成
func NewMiddleware(jwtService *JWTService, logger *zap.Logger) *Middleware {
	return &Middleware{
		jwtService: jwtService,
		logger:     logger,
	}
}

// Authenticate は認証ミドルウェア
func (m *Middleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Authorizationヘッダーからトークン取得
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// Cookieからも取得を試みる
			cookie, err := r.Cookie("access_token")
			if err != nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			authHeader = "Bearer " + cookie.Value
		}

		// Bearer トークン形式のチェック
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization header", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// トークン検証
		claims, err := m.jwtService.ValidateToken(tokenString)
		if err != nil {
			m.logger.Debug("Token validation failed", zap.Error(err))
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// クレームをコンテキストに追加
		ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequirePermission は権限チェックミドルウェア
func (m *Middleware) RequirePermission(permission Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaimsFromContext(r.Context())
			if claims == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// ロールベースの権限チェック
			user := &User{Role: claims.Role}
			if !user.HasPermission(permission) {
				m.logger.Warn("Permission denied",
					zap.String("user_id", claims.UserID),
					zap.String("role", string(claims.Role)),
					zap.String("required_permission", string(permission)),
				)
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetClaimsFromContext はコンテキストからクレームを取得
func GetClaimsFromContext(ctx context.Context) *Claims {
	claims, ok := ctx.Value(ClaimsContextKey).(*Claims)
	if !ok {
		return nil
	}
	return claims
}

// GetUserIDFromContext はコンテキストからユーザーIDを取得
func GetUserIDFromContext(ctx context.Context) string {
	claims := GetClaimsFromContext(ctx)
	if claims == nil {
		return ""
	}
	return claims.UserID
}
