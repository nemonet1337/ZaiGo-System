'use client';

import { useState } from 'react';
import { UserRole, Permission } from '@/types';
import {
    ShieldCheckIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

// ロール定義（バックエンドの RolePermissions に準拠）
const ROLES: {
    role: UserRole;
    label: string;
    description: string;
    color: string;
    permissions: Permission[];
}[] = [
        {
            role: 'SYSTEM_ADMIN',
            label: 'システム管理者',
            description: '全機能へのフルアクセス。ユーザー・ロール管理、監査ログ閲覧を含む。',
            color: 'bg-red-500',
            permissions: [
                'inventory:read', 'inventory:write',
                'master:read', 'master:write',
                'stocktaking:read', 'stocktaking:write',
                'report:read', 'audit:read', 'user:manage',
            ],
        },
        {
            role: 'INVENTORY_MANAGER',
            label: '在庫管理者',
            description: '在庫管理業務全般。マスタ編集、棚卸承認、レポート閲覧が可能。',
            color: 'bg-blue-500',
            permissions: [
                'inventory:read', 'inventory:write',
                'master:read', 'master:write',
                'stocktaking:read', 'stocktaking:write',
                'report:read',
            ],
        },
        {
            role: 'FIELD_OPERATOR',
            label: '現場担当者',
            description: '入出庫登録、棚卸入力など現場業務に必要な操作が可能。',
            color: 'bg-emerald-500',
            permissions: [
                'inventory:read', 'inventory:write',
                'stocktaking:read', 'stocktaking:write',
            ],
        },
        {
            role: 'ANALYST',
            label: 'アナリスト',
            description: '在庫データとレポートの参照・分析が可能。データ変更は不可。',
            color: 'bg-purple-500',
            permissions: [
                'inventory:read',
                'master:read',
                'report:read', 'audit:read',
            ],
        },
        {
            role: 'VIEWER',
            label: '閲覧者',
            description: '在庫情報とマスタの参照のみ可能。',
            color: 'bg-slate-400',
            permissions: [
                'inventory:read',
                'master:read',
            ],
        },
    ];

const ALL_PERMISSIONS: { key: Permission; label: string; category: string }[] = [
    { key: 'inventory:read', label: '在庫参照', category: '在庫' },
    { key: 'inventory:write', label: '在庫操作', category: '在庫' },
    { key: 'master:read', label: 'マスタ参照', category: 'マスタ' },
    { key: 'master:write', label: 'マスタ編集', category: 'マスタ' },
    { key: 'stocktaking:read', label: '棚卸参照', category: '棚卸' },
    { key: 'stocktaking:write', label: '棚卸操作', category: '棚卸' },
    { key: 'report:read', label: 'レポート参照', category: 'レポート' },
    { key: 'audit:read', label: '監査ログ参照', category: '管理' },
    { key: 'user:manage', label: 'ユーザー管理', category: '管理' },
];

export default function RolesPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>('SYSTEM_ADMIN');
    const selected = ROLES.find((r) => r.role === selectedRole)!;

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">ロール管理</h1>
                <p className="text-slate-500 mt-1">各ロールの権限定義を確認できます</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ロール一覧 */}
                <div className="lg:col-span-1 space-y-3">
                    {ROLES.map((roleInfo) => (
                        <button
                            key={roleInfo.role}
                            onClick={() => setSelectedRole(roleInfo.role)}
                            className={`w-full text-left p-4 rounded-xl transition-all ${selectedRole === roleInfo.role
                                    ? 'bg-white shadow-md ring-2 ring-emerald-500'
                                    : 'bg-white shadow-sm hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                                    <ShieldCheckIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{roleInfo.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {roleInfo.permissions.length} 権限
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* 権限詳細 */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selected.color}`}>
                                <ShieldCheckIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">{selected.label}</h2>
                                <p className="text-sm text-slate-500">{selected.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">カテゴリ</th>
                                    <th className="pb-3 text-left text-xs font-medium text-slate-500 uppercase">権限</th>
                                    <th className="pb-3 text-center text-xs font-medium text-slate-500 uppercase">付与</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ALL_PERMISSIONS.map((perm) => {
                                    const hasPermission = selected.permissions.includes(perm.key);
                                    return (
                                        <tr key={perm.key} className="hover:bg-slate-50">
                                            <td className="py-3 text-sm text-slate-500">{perm.category}</td>
                                            <td className="py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{perm.label}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{perm.key}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center">
                                                {hasPermission ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100">
                                                        <CheckIcon className="h-4 w-4 text-emerald-600" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100">
                                                        <XMarkIcon className="h-4 w-4 text-slate-400" />
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ロール比較サマリー */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                        <p className="text-xs text-slate-500">
                            このロールには <span className="font-semibold text-slate-700">{selected.permissions.length}</span> / {ALL_PERMISSIONS.length} の権限が付与されています。
                            ロールの変更はシステム管理者にお問い合わせください。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
