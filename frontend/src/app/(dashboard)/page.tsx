'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { StockAlert, StockWithDetails } from '@/types';
import {
    CubeIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
    totalProducts: number;
    totalLocations: number;
    lowStockCount: number;
    expiringCount: number;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalLocations: 0,
        lowStockCount: 0,
        expiringCount: 0,
    });
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [recentStock, setRecentStock] = useState<StockWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // アラート取得
                const alertsData = await api.inventory.getAlerts();
                setAlerts(alertsData.slice(0, 5));

                // 在庫データ取得（仮）
                const stockData = await api.inventory.search({ pageSize: 5 });
                setRecentStock(stockData.items);

                // 統計情報（実際のAPIに合わせて調整）
                setStats({
                    totalProducts: stockData.total,
                    totalLocations: 10, // 仮の値
                    lowStockCount: alertsData.filter((a) => a.type === 'low_stock').length,
                    expiringCount: alertsData.filter((a) => a.type === 'expiring').length,
                });
            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = [
        {
            title: '登録商品数',
            value: stats.totalProducts,
            icon: CubeIcon,
            color: 'bg-blue-500',
            href: '/inventory',
        },
        {
            title: 'ロケーション数',
            value: stats.totalLocations,
            icon: ArrowTrendingUpIcon,
            color: 'bg-emerald-500',
            href: '/master',
        },
        {
            title: '低在庫アラート',
            value: stats.lowStockCount,
            icon: ExclamationTriangleIcon,
            color: 'bg-amber-500',
            href: '/inventory?filter=low_stock',
        },
        {
            title: '期限切迫',
            value: stats.expiringCount,
            icon: ClockIcon,
            color: 'bg-red-500',
            href: '/expiring',
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ウェルカムメッセージ */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    おかえりなさい、{user?.name || 'ユーザー'}さん
                </h1>
                <p className="mt-1 opacity-90">
                    本日の在庫状況をご確認ください
                </p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{card.title}</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">
                                    {card.value.toLocaleString()}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${card.color}`}>
                                <card.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* アラート一覧 */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">最新アラート</h2>
                        <Link href="/expiring" className="text-sm text-emerald-600 hover:text-emerald-700">
                            すべて表示
                        </Link>
                    </div>
                    <div className="p-6">
                        {alerts.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">アラートはありません</p>
                        ) : (
                            <ul className="space-y-3">
                                {alerts.map((alert) => (
                                    <li
                                        key={alert.id}
                                        className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg"
                                    >
                                        <ExclamationTriangleIcon
                                            className={`h-5 w-5 flex-shrink-0 ${alert.type === 'expired'
                                                    ? 'text-red-500'
                                                    : alert.type === 'expiring'
                                                        ? 'text-amber-500'
                                                        : 'text-orange-500'
                                                }`}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {alert.message}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(alert.createdAt).toLocaleString('ja-JP')}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* クイックアクション */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-800">クイックアクション</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                        <Link
                            href="/transactions?type=inbound"
                            className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                            <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-600" />
                            <span className="mt-2 text-sm font-medium text-emerald-700">入庫登録</span>
                        </Link>
                        <Link
                            href="/transactions?type=outbound"
                            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <ArrowTrendingDownIcon className="h-8 w-8 text-blue-600" />
                            <span className="mt-2 text-sm font-medium text-blue-700">出庫登録</span>
                        </Link>
                        <Link
                            href="/inventory"
                            className="flex flex-col items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <CubeIcon className="h-8 w-8 text-slate-600" />
                            <span className="mt-2 text-sm font-medium text-slate-700">在庫検索</span>
                        </Link>
                        <Link
                            href="/stocktaking"
                            className="flex flex-col items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                            <ClockIcon className="h-8 w-8 text-amber-600" />
                            <span className="mt-2 text-sm font-medium text-amber-700">棚卸管理</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
