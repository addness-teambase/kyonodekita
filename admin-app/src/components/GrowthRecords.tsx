import React, { useState } from 'react';
import { TrendingUp, Plus, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { useRecord } from '../context/RecordContext';

interface GrowthRecord {
    id: string;
    childId: string;
    date: string;
    height?: number;
    weight?: number;
    note?: string;
    milestone?: string;
}

interface GrowthRecordsProps {
    childId?: string;
}

const GrowthRecords: React.FC<GrowthRecordsProps> = ({ childId }) => {
    const { activeChildId, getChildById } = useRecord();
    const [showAddModal, setShowAddModal] = useState(false);
    const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([
        {
            id: '1',
            childId: 'child1',
            date: '2024-01-15',
            height: 105,
            weight: 18.5,
            milestone: '一人で靴が履けるようになりました',
            note: '毎日練習した成果が出ました'
        },
        {
            id: '2',
            childId: 'child1',
            date: '2024-01-10',
            height: 104,
            weight: 18.3,
            milestone: 'ひらがなで名前が書けるようになりました'
        }
    ]);

    const targetChildId = childId || activeChildId;
    const child = targetChildId ? getChildById(targetChildId) : null;

    const childGrowthRecords = growthRecords.filter(record => record.childId === targetChildId);

    if (!targetChildId || !child) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">園児が選択されていません</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">成長記録</h2>
                                <p className="text-sm text-gray-500">{child.name}の成長の記録</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                        >
                            <Plus className="w-4 h-4 inline mr-1" />
                            記録追加
                        </button>
                    </div>
                </div>

                {/* 最新の身体測定 */}
                {childGrowthRecords.length > 0 && (
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">最新の測定値</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 text-sm font-bold">身</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">身長</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {childGrowthRecords[0].height}cm
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <span className="text-green-600 text-sm font-bold">体</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">体重</span>
                                </div>
                                <p className="text-2xl font-bold text-green-600">
                                    {childGrowthRecords[0].weight}kg
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 成長記録一覧 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">記録履歴</h3>
                </div>
                <div className="p-6">
                    {childGrowthRecords.length === 0 ? (
                        <div className="text-center py-8">
                            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">成長記録がありません</h3>
                            <p className="text-gray-500 mb-4">最初の成長記録を追加してみましょう</p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                            >
                                記録を追加
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {childGrowthRecords.map((record) => (
                                <div key={record.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-500">
                                                    {new Date(record.date).toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>

                                            {(record.height || record.weight) && (
                                                <div className="flex space-x-4 mb-2">
                                                    {record.height && (
                                                        <span className="text-sm text-gray-600">
                                                            身長: <span className="font-semibold text-blue-600">{record.height}cm</span>
                                                        </span>
                                                    )}
                                                    {record.weight && (
                                                        <span className="text-sm text-gray-600">
                                                            体重: <span className="font-semibold text-green-600">{record.weight}kg</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {record.milestone && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                                                    <p className="text-sm font-medium text-amber-800">
                                                        🎉 {record.milestone}
                                                    </p>
                                                </div>
                                            )}

                                            {record.note && (
                                                <p className="text-sm text-gray-700">{record.note}</p>
                                            )}
                                        </div>

                                        <div className="flex space-x-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 記録追加モーダル（簡略版） */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">成長記録追加</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-center text-gray-500 py-8">
                                成長記録追加機能は準備中です
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrowthRecords;