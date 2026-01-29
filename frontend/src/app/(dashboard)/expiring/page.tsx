'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Lot } from '@/types';
import {
    ExclamationTriangleIcon,
    ClockIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';

export default function ExpiringPage() {
    const [lots, setLots] = useState<Lot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterDays, setFilterDays] = useState(14);

    useEffect(() => {
        fetchExpiringLots();
    }, [filterDays]);

    const fetchExpiringLots = async () => {
        setIsLoading(true);
        try {
            const response = await api.lots.getExpiring(filterDays);
            setLots(response);
        } catch (error) {
            console.error('期限切迫ロット取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDaysUntilExpiry = (expiryDate: string): number => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const getUrgencyClass = (days: number): string => {
        if (days <= 0) return 'bg-red-100 text-red-700 border-red-200';
        if (days <= 7) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">期限切迫一覧</h1>
                    <p className="text-slate-500 mt-1">有効期限が近いロットを確認できます</p>
                </div>
            </div>

            {/* フィルタ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                    <FunnelIcon className="h-5 w-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-700">表示期間：</label>
                    <select
                        value={filterDays}
                        onChange={(e) => setFilterDays(parseInt(e.target.value))}
                        className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value={7}>7日以内</option>
                        <option value={14}>14日以内</option>
                        <option value={30}>30日以内</option>
                        <option value={60}>60日以内</option>
                    </select>
                </div>
            </div>

            {/* サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                        <div className="ml-4">
                            <p className="text-sm text-red-600">期限切れ</p>
                            <p className="text-2xl font-bold text-red-700">
                                {lots.filter((l) => l.expiryDate && getDaysUntilExpiry(l.expiryDate) <= 0).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <ClockIcon className="h-8 w-8 text-amber-500" />
                        <div className="ml-4">
                            <p className="text-sm text-amber-600">7日以内</p>
                            <p className="text-2xl font-bold text-amber-700">
                                {lots.filter((l) => l.expiryDate && getDaysUntilExpiry(l.expiryDate) > 0 && getDaysUntilExpiry(l.expiryDate) <= 7).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center">
                        <ClockIcon className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                            <p className="text-sm text-yellow-600">8〜14日以内</p>
                            <p className="text-2xl font-bold text-yellow-700">
                                {lots.filter((l) => l.expiryDate && getDaysUntilExpiry(l.expiryDate) > 7 && getDaysUntilExpiry(l.expiryDate) <= 14).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ロット一覧 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                緊急度
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                ロット番号
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                商品ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                ロケーション
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                数量
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                有効期限
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                                残日数
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                                </td>
                            </tr>
                        ) : lots.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    期限切迫のロットはありません
                                </td>
                            </tr>
                        ) : (
                            lots.map((lot) => {
                                const daysUntil = lot.expiryDate ? getDaysUntilExpiry(lot.expiryDate) : null;
                                return (
                                    <tr key={lot.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            {daysUntil !== null && (
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyClass(daysUntil)}`}>
                                                    {daysUntil <= 0 ? '期限切れ' : daysUntil <= 7 ? '緊急' : '注意'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                                            {lot.number}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-800">
                                            {lot.itemId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {lot.locationId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-800">
                                            {lot.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('ja-JP') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            {daysUntil !== null && (
                                                <span className={daysUntil <= 0 ? 'text-red-600 font-medium' : daysUntil <= 7 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                                                    {daysUntil <= 0 ? `${Math.abs(daysUntil)}日超過` : `${daysUntil}日`}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
