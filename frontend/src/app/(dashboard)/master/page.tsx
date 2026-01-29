'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Product, Location } from '@/types';
import {
    CubeIcon,
    MapPinIcon,
    UsersIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

type TabType = 'products' | 'locations' | 'users';

export default function MasterPage() {
    const [activeTab, setActiveTab] = useState<TabType>('products');
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const tabs = [
        { id: 'products' as TabType, name: '商品マスタ', icon: CubeIcon },
        { id: 'locations' as TabType, name: 'ロケーション', icon: MapPinIcon },
        { id: 'users' as TabType, name: 'ユーザー', icon: UsersIcon },
    ];

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'products') {
                const response = await api.products.list();
                setProducts(response.items);
            } else if (activeTab === 'locations') {
                const response = await api.locations.list();
                setLocations(response.items);
            }
        } catch (error) {
            console.error('マスタデータ取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">マスタ管理</h1>
                    <p className="text-slate-500 mt-1">商品・ロケーション・ユーザーマスタの管理</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    新規登録
                </button>
            </div>

            {/* タブ */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="border-b border-slate-200">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                                        ? 'border-emerald-500 text-emerald-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }
                `}
                            >
                                <tab.icon className="h-5 w-5 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* テーブル */}
                <div className="overflow-x-auto">
                    {activeTab === 'products' && (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">コード</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">商品名</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">カテゴリ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">単位</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">単価</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">状態</th>
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
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">データがありません</td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm font-medium text-emerald-600">{product.code}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800">{product.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{product.unit}</td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-slate-800">
                                                ¥{product.unitCost.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {product.isActive ? '有効' : '無効'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-1 text-slate-500 hover:text-slate-700"><PencilIcon className="h-4 w-4" /></button>
                                                    <button className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'locations' && (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">コード</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">タイプ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">容量</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">状態</th>
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
                                ) : locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">データがありません</td>
                                    </tr>
                                ) : (
                                    locations.map((location) => (
                                        <tr key={location.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm font-medium text-emerald-600">{location.code}</td>
                                            <td className="px-6 py-4 text-sm text-slate-800">{location.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{location.type}</td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-slate-800">{location.capacity?.toLocaleString() || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${location.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {location.isActive ? '有効' : '無効'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-1 text-slate-500 hover:text-slate-700"><PencilIcon className="h-4 w-4" /></button>
                                                    <button className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'users' && (
                        <div className="px-6 py-12 text-center text-slate-500">
                            ユーザー管理機能は準備中です
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
