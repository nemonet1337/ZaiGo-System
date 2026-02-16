'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '@/types';
import {
    UserPlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    CheckIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const ROLE_LABELS: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'システム管理者',
    INVENTORY_MANAGER: '在庫管理者',
    FIELD_OPERATOR: '現場担当者',
    ANALYST: 'アナリスト',
    VIEWER: '閲覧者',
};

const ROLE_COLORS: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'bg-red-100 text-red-700',
    INVENTORY_MANAGER: 'bg-blue-100 text-blue-700',
    FIELD_OPERATOR: 'bg-emerald-100 text-emerald-700',
    ANALYST: 'bg-purple-100 text-purple-700',
    VIEWER: 'bg-slate-100 text-slate-600',
};

type ModalMode = 'create' | 'edit' | null;

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<CreateUserRequest>({
        email: '',
        name: '',
        password: '',
        role: 'FIELD_OPERATOR',
    });

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.users.list(1, 100);
            setUsers(response.items);
        } catch (error) {
            console.error('ユーザー取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setFormData({ email: '', name: '', password: '', role: 'FIELD_OPERATOR' });
        setEditingUser(null);
        setModalMode('create');
    };

    const openEditModal = (user: User) => {
        setFormData({ email: user.email, name: user.name, password: '', role: user.role });
        setEditingUser(user);
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (modalMode === 'create') {
                await api.users.create(formData);
            } else if (modalMode === 'edit' && editingUser) {
                const updateData: UpdateUserRequest = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                };
                await api.users.update(editingUser.id, updateData);
            }
            closeModal();
            fetchUsers();
        } catch (error) {
            console.error('保存エラー:', error);
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            await api.users.update(user.id, { isActive: !user.isActive });
            fetchUsers();
        } catch (error) {
            console.error('更新エラー:', error);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`${user.name} を削除しますか？`)) return;
        try {
            await api.users.delete(user.id);
            fetchUsers();
        } catch (error) {
            console.error('削除エラー:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">ユーザー管理</h1>
                    <p className="text-slate-500 mt-1">ユーザーの登録・編集・無効化</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    新規ユーザー
                </button>
            </div>

            {/* 検索バー */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="名前またはメールアドレスで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* ユーザーテーブル */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">名前</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">メール</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ロール</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">状態</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">作成日</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    {searchQuery ? '検索結果がありません' : 'ユーザーが登録されていません'}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="ml-3 text-sm font-medium text-slate-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role]}`}>
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(user)}
                                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${user.isActive
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {user.isActive ? '有効' : '無効'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                                title="編集"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                title="削除"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* モーダル */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {modalMode === 'create' ? '新規ユーザー作成' : 'ユーザー編集'}
                            </h2>
                            <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">名前</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            {modalMode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ロール</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([role, label]) => (
                                        <option key={role} value={role}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                    <CheckIcon className="h-4 w-4 mr-1.5" />
                                    {modalMode === 'create' ? '作成' : '更新'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
