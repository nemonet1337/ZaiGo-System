package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// User は認証ユーザーを表現
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	Role         Role      `json:"role"`
	LocationID   *string   `json:"location_id,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Role はユーザーロールを表現
type Role string

const (
	RoleSystemAdmin      Role = "SYSTEM_ADMIN"
	RoleInventoryManager Role = "INVENTORY_MANAGER"
	RoleFieldOperator    Role = "FIELD_OPERATOR"
	RoleAnalyst          Role = "ANALYST"
	RoleViewer           Role = "VIEWER"
)

// Permission は権限を表現
type Permission string

const (
	PermissionInventoryRead   Permission = "inventory:read"
	PermissionInventoryWrite  Permission = "inventory:write"
	PermissionMasterRead      Permission = "master:read"
	PermissionMasterWrite     Permission = "master:write"
	PermissionStocktakingRead Permission = "stocktaking:read"
	PermissionStocktakingWrite Permission = "stocktaking:write"
	PermissionReportRead      Permission = "report:read"
	PermissionAuditRead       Permission = "audit:read"
	PermissionUserManage      Permission = "user:manage"
)

// RolePermissions はロールごとの権限マッピング
var RolePermissions = map[Role][]Permission{
	RoleSystemAdmin: {
		PermissionInventoryRead, PermissionInventoryWrite,
		PermissionMasterRead, PermissionMasterWrite,
		PermissionStocktakingRead, PermissionStocktakingWrite,
		PermissionReportRead, PermissionAuditRead, PermissionUserManage,
	},
	RoleInventoryManager: {
		PermissionInventoryRead, PermissionInventoryWrite,
		PermissionMasterRead, PermissionMasterWrite,
		PermissionStocktakingRead, PermissionStocktakingWrite,
		PermissionReportRead,
	},
	RoleFieldOperator: {
		PermissionInventoryRead, PermissionInventoryWrite,
		PermissionStocktakingRead, PermissionStocktakingWrite,
	},
	RoleAnalyst: {
		PermissionInventoryRead,
		PermissionMasterRead,
		PermissionReportRead, PermissionAuditRead,
	},
	RoleViewer: {
		PermissionInventoryRead,
		PermissionMasterRead,
	},
}

// HasPermission は指定された権限を持つかチェック
func (u *User) HasPermission(perm Permission) bool {
	perms, ok := RolePermissions[u.Role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

// SetPassword はパスワードをハッシュ化して設定
func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword はパスワードを検証
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// UserRepository はユーザーリポジトリのインターフェース
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, offset, limit int) ([]User, error)
}

// エラー定義
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserDisabled      = errors.New("user is disabled")
	ErrDuplicateEmail    = errors.New("email already exists")
)

// NewUser は新しいユーザーを作成
func NewUser(email, name, password string, role Role) (*User, error) {
	user := &User{
		ID:        uuid.New().String(),
		Email:     email,
		Name:      name,
		Role:      role,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := user.SetPassword(password); err != nil {
		return nil, err
	}

	return user, nil
}
