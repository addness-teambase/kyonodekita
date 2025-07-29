import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { useRecord } from '../context/RecordContext';

interface RecordSummaryProps {
    childId?: string;
}

const RecordSummary: React.FC<RecordSummaryProps> = ({ childId }) => {
    const {
        recordEvents,
        deleteRecordEvent,
        getCategoryName,
        formatTime,
        activeChildId
    } = useRecord();

    // 対象の園児IDを決定
    const targetChildId = childId || activeChildId;

    // 今日の記録を取得
    const todayEvents = React.useMemo(() => {
        if (!targetChildId) return [];

        const today = new Date().toDateString();
        return recordEvents.filter(record =>
            record.childId === targetChildId &&
            new Date(record.timestamp).toDateString() === today
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [recordEvents, targetChildId]);

    // カテゴリー別のスタイルを取得
    const getCategoryStyle = (category: string) => {
        const styles = {
            achievement: 'bg-green-50 text-green-800 border-green-200',
            happy: 'bg-blue-50 text-blue-800 border-blue-200',
            failure: 'bg-amber-50 text-amber-800 border-amber-200',
            trouble: 'bg-red-50 text-red-800 border-red-200'
        };
        return styles[category as keyof typeof styles] || 'bg-gray-50 text-gray-800 border-gray-200';
    };

    if (!targetChildId) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-500">園児が選択されていません</p>
            </div>
        );
    }

    if (todayEvents.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">今日の記録はまだありません</h3>
                <p className="text-gray-500">園児の活動記録が追加されるとここに表示されます</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                    今日の記録 ({todayEvents.length}件)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    {new Date().toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            <div className="p-6">
                <div className="space-y-4">
                    {todayEvents.map((record) => (
                        <div
                            key={record.id}
                            className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryStyle(record.category)}`}
                                        >
                                            {getCategoryName(record.category)}
                                        </span>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatTime(record.timestamp)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {record.note}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteRecordEvent(record.id)}
                                    className="ml-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    title="削除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RecordSummary; 