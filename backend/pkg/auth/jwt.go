package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Config はJWT設定
type Config struct {
	SecretKey     string
	Issuer        string
	TokenExpiry   time.Duration
	RefreshExpiry time.Duration
}

// DefaultConfig はデフォルトのJWT設定
func DefaultConfig() *Config {
	return &Config{
		SecretKey:     "your-secret-key-change-in-production",
		Issuer:        "zaigo-system",
		TokenExpiry:   15 * time.Minute,
		RefreshExpiry: 7 * 24 * time.Hour,
	}
}

// Claims はJWTクレームを表現
type Claims struct {
	UserID     string `json:"user_id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	Role       Role   `json:"role"`
	LocationID string `json:"location_id,omitempty"`
	jwt.RegisteredClaims
}

// TokenPair はアクセストークンとリフレッシュトークンのペア
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}

// JWTService はJWTトークンサービス
type JWTService struct {
	config *Config
}

// NewJWTService は新しいJWTサービスを作成
func NewJWTService(config *Config) *JWTService {
	if config == nil {
		config = DefaultConfig()
	}
	return &JWTService{config: config}
}

// GenerateTokens はアクセストークンとリフレッシュトークンを生成
func (s *JWTService) GenerateTokens(user *User) (*TokenPair, error) {
	now := time.Now()
	accessExpiry := now.Add(s.config.TokenExpiry)
	refreshExpiry := now.Add(s.config.RefreshExpiry)

	// アクセストークン生成
	locationID := ""
	if user.LocationID != nil {
		locationID = *user.LocationID
	}

	accessClaims := Claims{
		UserID:     user.ID,
		Email:      user.Email,
		Name:       user.Name,
		Role:       user.Role,
		LocationID: locationID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.config.Issuer,
			Subject:   user.ID,
			ExpiresAt: jwt.NewNumericDate(accessExpiry),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.config.SecretKey))
	if err != nil {
		return nil, err
	}

	// リフレッシュトークン生成
	refreshClaims := jwt.RegisteredClaims{
		Issuer:    s.config.Issuer,
		Subject:   user.ID,
		ExpiresAt: jwt.NewNumericDate(refreshExpiry),
		IssuedAt:  jwt.NewNumericDate(now),
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.config.SecretKey))
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresAt:    accessExpiry.Unix(),
	}, nil
}

// ValidateToken はトークンを検証してクレームを返す
func (s *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.config.SecretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// ValidateRefreshToken はリフレッシュトークンを検証してユーザーIDを返す
func (s *JWTService) ValidateRefreshToken(tokenString string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.config.SecretKey), nil
	})

	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid refresh token")
	}

	return claims.Subject, nil
}
