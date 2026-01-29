'use client';

import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';

export function Header() {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            {/* 左側: ページタイトルなど */}
            <div className="flex items-center">
                <h1 className="text-lg font-semibold text-slate-800">
                    在庫管理システム
                </h1>
            </div>

            {/* 右側: 通知とユーザーメニュー */}
            <div className="flex items-center space-x-4">
                {/* 通知アイコン */}
                <button className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
                    <BellIcon className="h-6 w-6" />
                    {/* 未読バッジ（仮） */}
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* ユーザー情報 */}
                <div className="flex items-center space-x-3">
                    <UserCircleIcon className="h-8 w-8 text-slate-400" />
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                        <p className="text-xs text-slate-500">{getRoleLabel(user?.role)}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

function getRoleLabel(role?: string): string {
    switch (role) {
        case 'SYSTEM_ADMIN':
            return 'システム管理者';
        case 'INVENTORY_MANAGER':
            return '在庫管理者';
        case 'FIELD_OPERATOR':
            return '現場担当者';
        case 'ANALYST':
            return '本社アナリスト';
        case 'VIEWER':
            return '閲覧者';
        default:
            return '不明';
    }
}
