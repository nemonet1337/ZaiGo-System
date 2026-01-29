'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Transaction, TransactionType } from '@/types';
import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    ArrowsRightLeftIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

type TabType = 'inbound' | 'outbound' | 'transfer';

export default function TransactionsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('inbound');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // フォーム状態
    const [formData, setFormData] = useState({
        itemId: '',
        locationId: '',
        toLocationId: '',
        quantity: 0,
        reference: '',
        lotNumber: '',
    });

    const tabs = [
        { id: 'inbound' as TabType, name: '入庫', icon: ArrowDownTrayIcon },
        { id: 'outbound' as TabType, name: '出庫', icon: ArrowUpTrayIcon },
        { id: 'transfer' as TabType, name: '移動', icon: ArrowsRightLeftIcon },
    ];

    useEffect(() => {
        fetchTransactions();
    }, [activeTab]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            // 履歴取得（実際のAPIに合わせて調整）
            const response = await api.inventory.getHistory('', 50);
            const filtered = response.filter((t) => t.type === activeTab);
            setTransactions(filtered);
        } catch (error) {
            console.error('履歴取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            switch (activeTab) {
                case 'inbound':
                    await api.inventory.add({
                        itemId: formData.itemId,
                        locationId: formData.locationId,
                        quantity: formData.quantity,
                        reference: formData.reference,
                        lotNumber: formData.lotNumber || undefined,
                    });
                    break;
                case 'outbound':
                    await api.inventory.remove({
                        itemId: formData.itemId,
                        locationId: formData.locationId,
                        quantity: formData.quantity,
                        reference: formData.reference,
                    });
                    break;
                case 'transfer':
                    await api.inventory.transfer({
                        itemId: formData.itemId,
                        fromLocationId: formData.locationId,
                        toLocationId: formData.toLocationId,
                        quantity: formData.quantity,
                        reference: formData.reference,
                    });
                    break;
            }
            setShowForm(false);
            resetForm();
            fetchTransactions();
        } catch (error) {
            console.error('登録エラー:', error);
            alert('登録に失敗しました');
        }
    };

    const resetForm = () => {
        setFormData({
            itemId: '',
            locationId: '',
            toLocationId: '',
            quantity: 0,
            reference: '',
            lotNumber: '',
        });
    };

    const getTypeLabel = (type: TransactionType) => {
        switch (type) {
            case 'inbound':
                return '入庫';
            case 'outbound':
                return '出庫';
            case 'transfer':
                return '移動';
            case 'adjust':
                return '調整';
            default:
                return type;
        }
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">入出庫管理</h1>
                    <p className="text-slate-500 mt-1">入庫・出庫・在庫移動の登録と履歴確認</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
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

                {/* 履歴テーブル */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    日時
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    種別
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
                                    参照番号
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                                    担当者
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        履歴データがありません
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(tx.createdAt).toLocaleString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${tx.type === 'inbound'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : tx.type === 'outbound'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                            >
                                                {getTypeLabel(tx.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                                            {tx.itemId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {tx.type === 'transfer'
                                                ? `${tx.fromLocationId} → ${tx.toLocationId}`
                                                : tx.fromLocationId || tx.toLocationId}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-mono text-slate-800">
                                            {tx.type === 'outbound' ? '-' : '+'}
                                            {tx.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {tx.reference}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {tx.createdBy}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 登録モーダル */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-800">
                                {activeTab === 'inbound' ? '入庫登録' : activeTab === 'outbound' ? '出庫登録' : '在庫移動'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 text-slate-400 hover:text-slate-600"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    商品コード <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.itemId}
                                    onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="ITEM-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {activeTab === 'transfer' ? '移動元ロケーション' : 'ロケーション'}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.locationId}
                                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">選択してください</option>
                                    <option value="LOC-001">倉庫A</option>
                                    <option value="LOC-002">倉庫B</option>
                                </select>
                            </div>

                            {activeTab === 'transfer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        移動先ロケーション <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.toLocationId}
                                        onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">選択してください</option>
                                        <option value="LOC-001">倉庫A</option>
                                        <option value="LOC-002">倉庫B</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    数量 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            {activeTab === 'inbound' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        ロット番号
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lotNumber}
                                        onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="LOT-20260129"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    参照番号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="PO-2026-001"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                    登録
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
