import React, { useState, useEffect } from 'react';
import { Calendar, Printer, User, ChevronLeft, ChevronRight, Award, Smile, HelpCircle, AlertTriangle, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface ChildData {
    id: string;
    name: string;
    age: number;
    birthdate?: string;
    gender?: string;
}

interface Record {
    id: string;
    child_id: string;
    category: 'achievement' | 'happy' | 'failure' | 'trouble';
    note: string;
    timestamp: string;
    created_at: string;
}

interface MonthlyRecordsByChildProps {
    facilityId: string;
    onClose: () => void;
}

const MonthlyRecordsByChild: React.FC<MonthlyRecordsByChildProps> = ({ facilityId, onClose }) => {
    const [children, setChildren] = useState<ChildData[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChildren();
    }, [facilityId]);

    useEffect(() => {
        if (selectedChildId) {
            fetchMonthlyRecords();
        }
    }, [selectedChildId, selectedDate]);

    const fetchChildren = async () => {
        try {
            const { data: facilityChildrenData, error } = await supabase
                .from('facility_children')
                .select('child_id')
                .eq('facility_id', facilityId);

            if (error) {
                console.error('施設の園児取得エラー:', error);
                return;
            }

            if (!facilityChildrenData || facilityChildrenData.length === 0) {
                return;
            }

            const childIds = facilityChildrenData.map(fc => fc.child_id);

            const { data: childrenData, error: childrenError } = await supabase
                .from('children')
                .select('id, name, age, birthdate, gender')
                .in('id', childIds)
                .order('name');

            if (childrenError) {
                console.error('園児情報取得エラー:', childrenError);
                return;
            }

            setChildren(childrenData || []);
            if (childrenData && childrenData.length > 0 && !selectedChildId) {
                setSelectedChildId(childrenData[0].id);
            }
        } catch (error) {
            console.error('園児取得処理エラー:', error);
        }
    };

    const fetchMonthlyRecords = async () => {
        if (!selectedChildId) return;

        setLoading(true);
        try {
            const monthStart = startOfMonth(selectedDate);
            const monthEnd = endOfMonth(selectedDate);

            const { data, error } = await supabase
                .from('records')
                .select('*')
                .eq('child_id', selectedChildId)
                .gte('timestamp', monthStart.toISOString())
                .lte('timestamp', monthEnd.toISOString())
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('記録取得エラー:', error);
                return;
            }

            setRecords(data || []);
        } catch (error) {
            console.error('記録取得処理エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (category: string) => {
        switch (category) {
            case 'achievement':
                return 'できた';
            case 'happy':
                return '嬉しい';
            case 'failure':
                return 'できない';
            case 'trouble':
                return '困った';
            default:
                return category;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'achievement':
                return <Award size={16} className="text-emerald-600" />;
            case 'happy':
                return <Smile size={16} className="text-sky-600" />;
            case 'failure':
                return <HelpCircle size={16} className="text-amber-600" />;
            case 'trouble':
                return <AlertTriangle size={16} className="text-rose-600" />;
            default:
                return null;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'achievement':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'happy':
                return 'bg-sky-50 text-sky-700 border-sky-200';
            case 'failure':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'trouble':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrevMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const selectedChild = children.find(c => c.id === selectedChildId);

    const stats = {
        achievement: records.filter(r => r.category === 'achievement').length,
        happy: records.filter(r => r.category === 'happy').length,
        failure: records.filter(r => r.category === 'failure').length,
        trouble: records.filter(r => r.category === 'trouble').length,
        total: records.length
    };

    // 日付ごとにグループ化
    const recordsByDate = records.reduce((acc, record) => {
        const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {} as Record<string, Record[]>);

    const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));

    return (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
            <div className="min-h-screen p-4 flex items-start justify-center py-8">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full">
                    {/* ヘッダー - 印刷時は非表示 */}
                    <div className="print:hidden flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-orange-500" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">個人別 月次記録一覧</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* コントロールパネル - 印刷時は非表示 */}
                    <div className="print:hidden p-6 bg-gray-50 border-b border-gray-200 space-y-4">
                        {/* 園児選択 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                園児を選択
                            </label>
                            <select
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                {children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                        {child.name} ({child.age}歳)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 月選択 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-300"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-lg font-semibold text-gray-900">
                                    {format(selectedDate, 'yyyy年M月', { locale: ja })}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-300"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* 印刷ボタン */}
                        <button
                            onClick={handlePrint}
                            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer size={20} />
                            印刷する
                        </button>
                    </div>

                    {/* 印刷用ヘッダー */}
                    <div className="hidden print:block p-6 border-b border-gray-300">
                        <h1 className="text-2xl font-bold text-center mb-4">月次記録一覧</h1>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold">園児名：</span>
                                {selectedChild?.name} ({selectedChild?.age}歳)
                            </div>
                            <div>
                                <span className="font-semibold">対象月：</span>
                                {format(selectedDate, 'yyyy年M月', { locale: ja })}
                            </div>
                        </div>
                    </div>

                    {/* 統計サマリー */}
                    <div className="p-6">
                        <div className="grid grid-cols-5 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                                <div className="text-sm text-emerald-700 mb-1">できた</div>
                                <div className="text-2xl font-bold text-emerald-700">{stats.achievement}</div>
                            </div>
                            <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-4 rounded-xl border border-sky-200">
                                <div className="text-sm text-sky-700 mb-1">嬉しい</div>
                                <div className="text-2xl font-bold text-sky-700">{stats.happy}</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                                <div className="text-sm text-amber-700 mb-1">できない</div>
                                <div className="text-2xl font-bold text-amber-700">{stats.failure}</div>
                            </div>
                            <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl border border-rose-200">
                                <div className="text-sm text-rose-700 mb-1">困った</div>
                                <div className="text-2xl font-bold text-rose-700">{stats.trouble}</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                                <div className="text-sm text-gray-700 mb-1">合計</div>
                                <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
                            </div>
                        </div>

                        {/* 記録一覧 */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                <p className="mt-4 text-gray-600">読み込み中...</p>
                            </div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-600">この月の記録はありません</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sortedDates.map((date) => {
                                    const dayRecords = recordsByDate[date];
                                    return (
                                        <div key={date} className="border border-gray-200 rounded-xl p-4 print:border-gray-400 print:break-inside-avoid">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                                <Calendar size={16} className="text-orange-500" />
                                                <h3 className="font-semibold text-gray-900">
                                                    {format(new Date(date), 'M月d日(E)', { locale: ja })}
                                                </h3>
                                                <span className="ml-auto text-sm text-gray-500">
                                                    {dayRecords.length}件
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {dayRecords.map((record) => (
                                                    <div
                                                        key={record.id}
                                                        className={`p-3 rounded-lg border ${getCategoryColor(record.category)}`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {getCategoryIcon(record.category)}
                                                            <span className="font-medium">
                                                                {getCategoryName(record.category)}
                                                            </span>
                                                            <span className="ml-auto text-sm text-gray-600">
                                                                {format(new Date(record.timestamp), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                        {record.note && (
                                                            <p className="text-sm text-gray-700 ml-6">
                                                                {record.note}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 印刷用CSS */}
            <style>
                {`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            @page {
              margin: 1cm;
            }
          }
        `}
            </style>
        </div>
    );
};

export default MonthlyRecordsByChild;


