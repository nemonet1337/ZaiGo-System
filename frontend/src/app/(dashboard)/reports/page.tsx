'use client';

import { useState } from 'react';
import {
    ChartBarIcon,
    ArrowDownTrayIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';

type ReportType = 'stock_summary' | 'transaction' | 'expiry';

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<ReportType>('stock_summary');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const reports = [
        { id: 'stock_summary' as ReportType, name: '在庫サマリー', description: '現在の在庫状況を商品・ロケーション別に集計' },
        { id: 'transaction' as ReportType, name: '入出庫レポート', description: '期間内の入出庫履歴を集計' },
        { id: 'expiry' as ReportType, name: '期限管理レポート', description: '期限切迫・期限切れロットの一覧' },
    ];

    const handleExport = () => {
        alert('CSV出力機能は実装予定です');
    };

    return (
        <div className="space-y-6">
            {/* ページヘッダー */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">レポート</h1>
                <p className="text-slate-500 mt-1">在庫・業務レポートの参照とCSV出力</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* レポート選択サイドバー */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h2 className="text-sm font-semibold text-slate-800 mb-3">レポート種別</h2>
                        <nav className="space-y-1">
                            {reports.map((report) => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedReport === report.id
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {report.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* レポートコンテンツ */}
                <div className="lg:col-span-3 space-y-6">
                    {/* レポート設定 */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            {reports.find((r) => r.id === selectedReport)?.name}
                        </h2>
                        <p className="text-slate-500 text-sm mb-4">
                            {reports.find((r) => r.id === selectedReport)?.description}
                        </p>

                        {selectedReport !== 'stock_summary' && (
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm text-slate-600">期間:</span>
                                </div>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-slate-400">〜</span>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                <ChartBarIcon className="h-5 w-5 mr-2" />
                                レポート表示
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                CSV出力
                            </button>
                        </div>
                    </div>

                    {/* レポートプレビュー（プレースホルダー） */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-center h-64 text-slate-400">
                            <div className="text-center">
                                <ChartBarIcon className="h-12 w-12 mx-auto mb-3" />
                                <p>レポートを選択して「レポート表示」をクリックしてください</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
