import React, { useState } from 'react';
import {
    Award,
    Smile,
    HelpCircle,
    AlertTriangle,
    Clock,
    Trash2
} from 'lucide-react';
import { RecordEvent, RecordCategory } from '../context/RecordContext';

interface RecordSummaryProps {
    records: RecordEvent[];
    onDeleteRecord: (id: string) => void;
    getCategoryName: (category: RecordCategory) => string;
    formatTime: (date: Date) => string;
}

const RecordSummary: React.FC<RecordSummaryProps> = ({
    records,
    onDeleteRecord,
    getCategoryName,
    formatTime
}) => {
      const [activeTab, setActiveTab] = useState<RecordCategory>('achievement');

  // カテゴリー別の記録をフィルタリング
  const filteredRecords = records.filter(record => record.category === activeTab);

    // カテゴリーアイコンと色の取得
    const getCategoryIconAndColor = (category: RecordCategory) => {
        const config = {
            achievement: {
                icon: <Award size={16} />,
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                textColor: 'text-green-700',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600'
            },
            happy: {
                icon: <Smile size={16} />,
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-700',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600'
            },
            failure: {
                icon: <HelpCircle size={16} />,
                bgColor: 'bg-amber-50',
                borderColor: 'border-amber-200',
                textColor: 'text-amber-700',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600'
            },
            trouble: {
                icon: <AlertTriangle size={16} />,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-700',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600'
            }
        };
        return config[category];
    };

    const categories: { key: RecordCategory; name: string; icon: React.ReactNode }[] = [
        { key: 'achievement', name: 'できたこと', icon: <Award size={18} /> },
        { key: 'happy', name: 'うれしかったこと', icon: <Smile size={18} /> },
        { key: 'failure', name: '気になったこと', icon: <HelpCircle size={18} /> },
        { key: 'trouble', name: 'こまったこと', icon: <AlertTriangle size={18} /> }
    ];

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* ヘッダー */}
            <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                    今日の記録一覧
                </h3>
            </div>

            {/* タブナビゲーション */}
            <div className="flex border-b border-gray-100">
                {categories.map(category => {
                    const count = records.filter(r => r.category === category.key).length;
                    return (
                        <button
                            key={category.key}
                            onClick={() => setActiveTab(category.key)}
                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                activeTab === category.key
                                    ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            {category.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* 記録一覧 */}
            <div className="max-h-96 overflow-y-auto">
                {filteredRecords.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">📝</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            このカテゴリーの記録がありません
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredRecords.map(record => {
                            const config = getCategoryIconAndColor(record.category);
                            return (
                                <div
                                    key={record.id}
                                    className={`p-4 rounded-xl ${config.bgColor} border-l-4 ${config.borderColor}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center`}>
                                                <span className={config.iconColor}>{config.icon}</span>
                                            </div>
                                            <div>
                                                <span className={`text-sm font-semibold ${config.textColor}`}>
                                                    {getCategoryName(record.category)}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <Clock size={12} />
                                                    {formatTime(new Date(record.timestamp))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteRecord(record.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="削除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-10">{record.note}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecordSummary; 