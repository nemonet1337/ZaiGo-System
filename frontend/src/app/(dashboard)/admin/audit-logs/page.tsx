'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    EyeIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    'CREATE': { label: '作成', color: 'bg-emerald-100 text-emerald-700' },
    'UPDATE': { label: '更新', color: 'bg-blue-100 text-blue-700' },
    'DELETE': { label: '削除', color: 'bg-red-100 text-red-700' },
    'LOGIN': { label: 'ログイン', color: 'bg-purple-100 text-purple-700' },
    'LOGOUT': { label: 'ログアウト', color: 'bg-slate-100 text-slate-600' },
    'APPROVE': { label: '承認', color: 'bg-amber-100 text-amber-700' },
    'REJECT': { label: '却下', color: 'bg-orange-100 text-orange-700' },
    'EXPORT': { label: 'エクスポート', color: 'bg-teal-100 text-teal-700' },
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
    'user': 'ユーザー',
    'product': '商品',
    'location': 'ロケーション',
    'inventory': '在庫',
    'stocktaking': '棚卸',
    'lot': 'ロット',
    'role': 'ロール',
};

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    // フィルタ
    const [filters, setFilters] = useState({
        action: '',
        from: '',
        to: '',
    });

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filters.action) params.action = filters.action;
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            params.page = String(currentPage);
            params.pageSize = String(PAGE_SIZE);

            const response = await api.audit.list(params);
            setLogs(response.items);
            setTotalItems(response.total);
        } catch (error) {
            console.error('監査ログ取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    const handleExportCsv = () => {
        const url = api.audit.exportCsv({
            action: filters.action || undefined,
            from: filters.from || undefined,
            to: filters.to || undefined,
        });
        window.open(url, '_blank');
    };

    const handleFilterApply = () => {
        setCurrentPage(1);
        setShowFilters(false);
    };

    const handleFilterReset = () => {
        setFilters({ action: '', from: '', to: '' });
        setCurrentPage(1);
        setShowFilters(false);
    };

    const getActionBadge = (action: string) => {
        const config = ACTION_LABELS[action] || { label: action, color: 'bg-slate-100 text-slate-600' };
        return (
            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${config.color}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">監査ログ</h1>
                    <p className="text-slate-500 mt-1">システム操作の履歴を確認できます</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <FunnelIcon className="h-4 w-4 mr-2" />
                        フィルタ
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        CSV出力
                    </button>
                </div>
            </div>

            {/* フィルタパネル */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">フィルタ条件</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">アクション</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">すべて</option>
                                {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">開始日</label>
                            <input
                                type="date"
                                value={filters.from}
                                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">終了日</label>
                            <input
                                type="date"
                                value={filters.to}
                                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={handleFilterReset}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            リセット
                        </button>
                        <button
                            onClick={handleFilterApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <MagnifyingGlassIcon className="h-4 w-4 inline mr-1.5" />
                            検索
                        </button>
                    </div>
                </div>
            )}

            {/* ログテーブル */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">日時</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ユーザー</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">アクション</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">対象</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">IPアドレス</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">詳細</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <DocumentTextIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                                    ログがありません
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                        {log.userName || log.userId.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <span className="text-slate-400">{ENTITY_TYPE_LABELS[log.entityType] || log.entityType}</span>
                                        <span className="text-slate-300 mx-1">/</span>
                                        <span className="font-mono text-xs">{log.entityId.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                            title="詳細を見る"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ページネーション */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-500">
                            全 {totalItems.toLocaleString()} 件中 {((currentPage - 1) * PAGE_SIZE) + 1}〜{Math.min(currentPage * PAGE_SIZE, totalItems)} 件を表示
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-slate-600 min-w-[80px] text-center">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 詳細モーダル */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800">操作ログ詳細</h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">日時</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {new Date(selectedLog.createdAt).toLocaleString('ja-JP')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">ユーザー</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {selectedLog.userName || selectedLog.userId}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">アクション</p>
                                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">IPアドレス</p>
                                    <p className="text-sm font-mono text-slate-800 mt-1">{selectedLog.ipAddress}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">対象タイプ</p>
                                    <p className="text-sm text-slate-800 mt-1">
                                        {ENTITY_TYPE_LABELS[selectedLog.entityType] || selectedLog.entityType}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase">対象ID</p>
                                    <p className="text-sm font-mono text-slate-800 mt-1">{selectedLog.entityId}</p>
                                </div>
                            </div>

                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">詳細データ</p>
                                    <pre className="bg-slate-50 rounded-lg p-4 text-xs font-mono text-slate-700 overflow-auto max-h-60">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
