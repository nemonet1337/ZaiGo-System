'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Stocktaking, StocktakingStatus } from '@/types';
import {
    ClipboardDocumentCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';

export default function StocktakingPage() {
    const [stocktakings, setStocktakings] = useState<Stocktaking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<StocktakingStatus | ''>('');

    useEffect(() => {
        fetchStocktakings();
    }, [filterStatus]);

    const fetchStocktakings = async () => {
        setIsLoading(true);
        try {
            const response = await api.stocktaking.list(filterStatus || undefined);
            setStocktakings(response);
        } catch (error) {
            console.error('棚卸データ取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusLabel = (status: StocktakingStatus): string => {
        switch (status) {
            case 'DRAFT': return '下書き';
            case 'IN_PROGRESS': return '実施中';
            case 'PENDING_APPROVAL': return '承認待ち';
            case 'APPROVED': return '承認済み';
            case 'REJECTED': return '却下';
            default: return status;
        }
    };

    const getStatusClass = (status: StocktakingStatus): string => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-700';
            case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const handleApprove = async (id: string) => {
        if (!confirm('この棚卸を承認しますか？在庫差異が反映されます。')) return;
        try {
            await api.stocktaking.approve(id);
            fetchStocktakings();
        } catch (error) {
            alert('承認に失敗しました');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('却下理由を入力してください');
        if (!reason) return;
        try {
            await api.stocktaking.reject(id, reason);
            fetchStocktakings();
        } catch (error) {
            alert('却下に失敗しました');
        }
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">棚卸管理</h1>
                    <p className="text-slate-500 mt-1">棚卸の実施・承認・履歴確認</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    新規棚卸
                </button>
            </div>

            {/* フィルタ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">ステータス：</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as StocktakingStatus | '')}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">すべて</option>
                        <option value="DRAFT">下書き</option>
                        <option value="IN_PROGRESS">実施中</option>
                        <option value="PENDING_APPROVAL">承認待ち</option>
                        <option value="APPROVED">承認済み</option>
                        <option value="REJECTED">却下</option>
                    </select>
                </div>
            </div>

            {/* 棚卸一覧 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ロケーション</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">予定日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ステータス</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">作成者</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">作成日時</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                </td>
                            </tr>
                        ) : stocktakings.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    棚卸データがありません
                                </td>
                            </tr>
                        ) : (
                            stocktakings.map((st) => (
                                <tr key={st.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                                        {st.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-800">{st.locationId}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(st.scheduledDate).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(st.status)}`}>
                                            {getStatusLabel(st.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{st.createdBy}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(st.createdAt).toLocaleString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {st.status === 'PENDING_APPROVAL' && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(st.id)}
                                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                    title="承認"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(st.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="却下"
                                                >
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
