'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
    HomeIcon,
    CubeIcon,
    ArrowsRightLeftIcon,
    ClipboardDocumentCheckIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
    UsersIcon,
    ShieldCheckIcon,
    DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'ダッシュボード', href: '/', icon: HomeIcon },
    { name: '在庫参照', href: '/inventory', icon: CubeIcon },
    { name: '入出庫管理', href: '/transactions', icon: ArrowsRightLeftIcon },
    { name: '棚卸管理', href: '/stocktaking', icon: ClipboardDocumentCheckIcon },
    { name: 'マスタ管理', href: '/master', icon: Cog6ToothIcon },
    { name: 'ロット履歴', href: '/lot-history', icon: ClockIcon },
    { name: '期限切迫一覧', href: '/expiring', icon: ExclamationTriangleIcon },
    { name: 'レポート', href: '/reports', icon: ChartBarIcon },
];

const adminNavigation = [
    { name: 'ユーザー管理', href: '/admin/users', icon: UsersIcon },
    { name: 'ロール管理', href: '/admin/roles', icon: ShieldCheckIcon },
    { name: '監査ログ', href: '/admin/audit-logs', icon: DocumentMagnifyingGlassIcon },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'SYSTEM_ADMIN';

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900">
            {/* ロゴ */}
            <div className="flex h-16 items-center px-6">
                <DocumentTextIcon className="h-8 w-8 text-emerald-500" />
                <span className="ml-3 text-xl font-bold text-white">ZaiGo</span>
            </div>

            {/* メインナビゲーション */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }
              `}
                        >
                            <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            {item.name}
                        </Link>
                    );
                })}

                {/* 管理メニュー（システム管理者のみ） */}
                {isAdmin && (
                    <>
                        <div className="pt-4 pb-2 px-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">管理</p>
                        </div>
                        {adminNavigation.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-emerald-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }
                  `}
                                >
                                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* ユーザー情報 */}
            <div className="border-t border-slate-700 p-4">
                <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name || 'ユーザー'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {user?.role || '権限なし'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-3 p-2 text-slate-400 hover:text-white transition-colors"
                        title="ログアウト"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

