'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StockWithDetails, StockSearchParams, Location, Product } from '@/types';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function InventoryPage() {
    const [stocks, setStocks] = useState<StockWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useState<StockSearchParams>({
        page: 1,
        pageSize: 20,
    });
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // 検索フォーム用の状態
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchStocks();
    }, [searchParams]);

    const fetchStocks = async () => {
        setIsLoading(true);
        try {
            const response = await api.inventory.search(searchParams);
            setStocks(response.items);
            setTotalPages(response.totalPages);
            setTotal(response.total);
        } catch (error) {
            console.error('在庫取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams((prev) => ({
            ...prev,
            productName: searchKeyword || undefined,
            locationId: selectedLocation || undefined,
            category: selectedCategory || undefined,
            page: 1,
        }));
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams((prev) => ({ ...prev, page: newPage }));
    };

    const handleExportCSV = async () => {
        // CSV出力処理（実装予定）
        alert('CSV出力機能は実装予定です');
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">在庫参照</h1>
                    <p className="text-slate-500 mt-1">商品・ロケーション別の在庫状況を確認できます</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    CSV出力
                </button>
            </div>

            {/* 検索・フィルタ */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <form onSubmit={handleSearch}>
                    <div className="flex items-center gap-4">
                        {/* 検索ボックス */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="商品コード、商品名で検索..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                        </div>

                        {/* フィルタトグル */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${showFilters
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <FunnelIcon className="h-5 w-5 mr-2" />
                            フィルタ
                        </button>

                        {/* 検索ボタン */}
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            検索
                        </button>
                    </div>

                    {/* 拡張フィルタ */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    ロケーション
                                </label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="LOC-001">倉庫A</option>
                                    <option value="LOC-002">倉庫B</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    カテゴリ
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="food">食品</option>
                                    <option value="beverage">飲料</option>
                                    <option value="daily">日用品</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    在庫数量
                                </label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="low">低在庫（10個以下）</option>
                                    <option value="normal">通常（11〜100個）</option>
                                    <option value="high">多在庫（101個以上）</option>
                                </select>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* 在庫一覧テーブル */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    商品コード
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    商品名
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    ロケーション
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    現在庫
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    予約済
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    利用可能
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    更新日時
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                            <span className="ml-3 text-slate-500">読み込み中...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        該当するデータがありません
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((stock, index) => (
                                    <tr key={`${stock.itemId}-${stock.locationId}`} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                                            {stock.product?.code || stock.itemId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                            {stock.product?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {stock.location?.name || stock.locationId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 text-right font-mono">
                                            {stock.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right font-mono">
                                            {stock.reserved.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                            <span
                                                className={`font-medium ${stock.available < 10
                                                        ? 'text-red-600'
                                                        : stock.available < 50
                                                            ? 'text-amber-600'
                                                            : 'text-emerald-600'
                                                    }`}
                                            >
                                                {stock.available.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(stock.updatedAt).toLocaleString('ja-JP')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ページネーション */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        全 {total.toLocaleString()} 件中 {((searchParams.page || 1) - 1) * (searchParams.pageSize || 20) + 1} -
                        {Math.min((searchParams.page || 1) * (searchParams.pageSize || 20), total)} 件を表示
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange((searchParams.page || 1) - 1)}
                            disabled={(searchParams.page || 1) <= 1}
                            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <span className="text-sm text-slate-600">
                            {searchParams.page || 1} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange((searchParams.page || 1) + 1)}
                            disabled={(searchParams.page || 1) >= totalPages}
                            className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
