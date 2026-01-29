'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Transaction, Lot } from '@/types';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function LotHistoryPage() {
    const [lotNumber, setLotNumber] = useState('');
    const [history, setHistory] = useState<Transaction[]>([]);
    const [lot, setLot] = useState<Lot | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lotNumber.trim()) return;

        setIsLoading(true);
        setSearched(true);
        try {
            const historyData = await api.lots.getHistory(lotNumber);
            setHistory(historyData);
        } catch (error) {
            console.error('ロット履歴取得エラー:', error);
            setHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">ロット履歴参照</h1>
                <p className="text-slate-500 mt-1">ロット単位での入出庫履歴を追跡できます</p>
            </div>

            {/* 検索フォーム */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <form onSubmit={handleSearch} className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="ロット番号を入力してください"
                            value={lotNumber}
                            onChange={(e) => setLotNumber(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        )}
                        検索
                    </button>
                </form>
            </div>

            {/* 検索結果 */}
            {searched && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800">
                            ロット履歴: {lotNumber}
                        </h2>
                    </div>

                    {isLoading ? (
                        <div className="px-6 py-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="px-6 py-12 text-center text-slate-500">
                            該当するロット履歴が見つかりませんでした
                        </div>
                    ) : (
                        <div className="relative">
                            {/* タイムライン */}
                            <div className="px-6 py-4">
                                <div className="space-y-4">
                                    {history.map((tx, index) => (
                                        <div key={tx.id} className="flex">
                                            {/* タイムラインドット */}
                                            <div className="flex flex-col items-center mr-4">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${tx.type === 'inbound'
                                                            ? 'bg-emerald-500'
                                                            : tx.type === 'outbound'
                                                                ? 'bg-blue-500'
                                                                : 'bg-amber-500'
                                                        }`}
                                                />
                                                {index < history.length - 1 && (
                                                    <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                                                )}
                                            </div>

                                            {/* コンテンツ */}
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tx.type === 'inbound'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : tx.type === 'outbound'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                            }`}
                                                    >
                                                        {tx.type === 'inbound' ? '入庫' : tx.type === 'outbound' ? '出庫' : '移動'}
                                                    </span>
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(tx.createdAt).toLocaleString('ja-JP')}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-3">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">商品:</span>
                                                            <span className="ml-1 font-medium text-slate-800">{tx.itemId}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">ロケーション:</span>
                                                            <span className="ml-1 text-slate-800">
                                                                {tx.type === 'transfer'
                                                                    ? `${tx.fromLocationId} → ${tx.toLocationId}`
                                                                    : tx.fromLocationId || tx.toLocationId}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">数量:</span>
                                                            <span className={`ml-1 font-mono font-medium ${tx.type === 'outbound' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                                {tx.type === 'outbound' ? '-' : '+'}{tx.quantity}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">担当:</span>
                                                            <span className="ml-1 text-slate-800">{tx.createdBy}</span>
                                                        </div>
                                                    </div>
                                                    {tx.reference && (
                                                        <div className="mt-2 text-sm">
                                                            <span className="text-slate-500">参照:</span>
                                                            <span className="ml-1 text-slate-600">{tx.reference}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
