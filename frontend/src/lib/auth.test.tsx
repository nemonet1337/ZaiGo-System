import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

// APIをモック
vi.mock('@/lib/api', () => ({
    api: {
        auth: {
            me: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
        },
    },
}));

const mockApi = api as {
    auth: {
        me: Mock;
        login: Mock;
        logout: Mock;
    };
};

// テスト用コンポーネント
function TestComponent() {
    const { user, isLoading, login, logout } = useAuth();

    if (isLoading) {
        return <div data-testid="loading">Loading...</div>;
    }

    if (user) {
        return (
            <div>
                <div data-testid="user-email">{user.email}</div>
                <button data-testid="logout-btn" onClick={logout}>
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div>
            <div data-testid="not-authenticated">Not authenticated</div>
            <button
                data-testid="login-btn"
                onClick={() => login('test@example.com', 'password')}
            >
                Login
            </button>
        </div>
    );
}

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show loading state initially', async () => {
        mockApi.auth.me.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show user when authenticated', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
        mockApi.auth.me.mockResolvedValueOnce(mockUser);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-email')).toBeInTheDocument();
        });

        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should show not authenticated when me() fails', async () => {
        mockApi.auth.me.mockRejectedValueOnce(new Error('Unauthorized'));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
        });
    });

    it('should handle login', async () => {
        mockApi.auth.me.mockRejectedValueOnce(new Error('Unauthorized'));
        mockApi.auth.login.mockResolvedValueOnce({
            user: { id: 'user-1', email: 'test@example.com' },
            token: 'jwt-token',
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
        });

        const loginBtn = screen.getByTestId('login-btn');
        await act(async () => {
            await userEvent.click(loginBtn);
        });

        expect(mockApi.auth.login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should handle logout', async () => {
        const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
        mockApi.auth.me.mockResolvedValueOnce(mockUser);
        mockApi.auth.logout.mockResolvedValueOnce({});

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('user-email')).toBeInTheDocument();
        });

        const logoutBtn = screen.getByTestId('logout-btn');
        await act(async () => {
            await userEvent.click(logoutBtn);
        });

        expect(mockApi.auth.logout).toHaveBeenCalled();
    });
});

describe('useAuth', () => {
    it('should throw error when used outside AuthProvider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleError.mockRestore();
    });
});
