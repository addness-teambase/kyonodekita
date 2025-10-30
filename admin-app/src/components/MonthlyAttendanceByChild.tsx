import React, { useState, useEffect } from 'react';
import { Calendar, Printer, X, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

interface AttendanceRecord {
    id: string;
    child_id: string;
    date: string;
    attendance_status: 'present' | 'absent' | 'late' | 'early_departure' | 'scheduled';
    actual_arrival_time: string | null;
    actual_departure_time: string | null;
    scheduled_arrival_time: string | null;
    scheduled_departure_time: string | null;
    notes: string | null;
    created_at: string;
}

interface MonthlyAttendanceByChildProps {
    facilityId: string;
    onClose: () => void;
}

const MonthlyAttendanceByChild: React.FC<MonthlyAttendanceByChildProps> = ({ facilityId, onClose }) => {
    const [children, setChildren] = useState<ChildData[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchChildren();
    }, [facilityId]);

    useEffect(() => {
        if (selectedChildId) {
            fetchMonthlyAttendance();
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

    const fetchMonthlyAttendance = async () => {
        if (!selectedChildId) return;

        setLoading(true);
        try {
            const monthStart = startOfMonth(selectedDate);
            const monthEnd = endOfMonth(selectedDate);

            const { data, error } = await supabase
                .from('attendance_schedules')
                .select('*')
                .eq('child_id', selectedChildId)
                .eq('facility_id', facilityId)
                .gte('date', format(monthStart, 'yyyy-MM-dd'))
                .lte('date', format(monthEnd, 'yyyy-MM-dd'))
                .order('date', { ascending: true });

            if (error) {
                console.error('出席記録取得エラー:', error);
                return;
            }

            setRecords(data || []);
        } catch (error) {
            console.error('出席記録取得処理エラー:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'present':
                return { label: '出席', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' };
            case 'absent':
                return { label: '欠席', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, iconColor: 'text-red-600' };
            case 'late':
                return { label: '遅刻', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle, iconColor: 'text-yellow-600' };
            case 'early_departure':
                return { label: '早退', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle, iconColor: 'text-orange-600' };
            case 'scheduled':
                return { label: '予定', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, iconColor: 'text-blue-600' };
            default:
                return { label: status, color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock, iconColor: 'text-gray-600' };
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
        present: records.filter(r => r.attendance_status === 'present').length,
        absent: records.filter(r => r.attendance_status === 'absent').length,
        late: records.filter(r => r.attendance_status === 'late').length,
        early_departure: records.filter(r => r.attendance_status === 'early_departure').length,
        scheduled: records.filter(r => r.attendance_status === 'scheduled').length,
        total: records.length
    };

    // 日付ごとにグループ化（既にソート済み）
    const recordsByDate = records.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    const sortedDates = Object.keys(recordsByDate).sort((a, b) => b.localeCompare(a));

    return (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
            <div className="min-h-screen p-4 flex items-start justify-center py-8">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full">
                    {/* ヘッダー - 印刷時は非表示 */}
                    <div className="print:hidden flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-blue-500" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">個人別 月次出席記録</h2>
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer size={20} />
                            印刷する
                        </button>
                    </div>

                    {/* 印刷用ヘッダー */}
                    <div className="hidden print:block p-6 border-b border-gray-300">
                        <h1 className="text-2xl font-bold text-center mb-4">月次出席記録</h1>
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
                        <div className="grid grid-cols-6 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
                                <div className="text-xs text-green-700 mb-1">出席</div>
                                <div className="text-xl font-bold text-green-700">{stats.present}</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 rounded-xl border border-red-200">
                                <div className="text-xs text-red-700 mb-1">欠席</div>
                                <div className="text-xl font-bold text-red-700">{stats.absent}</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-xl border border-yellow-200">
                                <div className="text-xs text-yellow-700 mb-1">遅刻</div>
                                <div className="text-xl font-bold text-yellow-700">{stats.late}</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl border border-orange-200">
                                <div className="text-xs text-orange-700 mb-1">早退</div>
                                <div className="text-xl font-bold text-orange-700">{stats.early_departure}</div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                                <div className="text-xs text-blue-700 mb-1">予定</div>
                                <div className="text-xl font-bold text-blue-700">{stats.scheduled}</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
                                <div className="text-xs text-gray-700 mb-1">合計</div>
                                <div className="text-xl font-bold text-gray-700">{stats.total}</div>
                            </div>
                        </div>

                        {/* 出席記録一覧 */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="mt-4 text-gray-600">読み込み中...</p>
                            </div>
                        ) : records.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl">
                                <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-600">この月の出席記録はありません</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedDates.map((date) => {
                                    const dayRecords = recordsByDate[date];
                                    return (
                                        <div key={date} className="border border-gray-200 rounded-xl p-4 print:border-gray-400 print:break-inside-avoid">
                                            {dayRecords.map((record) => {
                                                const statusInfo = getStatusInfo(record.attendance_status);
                                                const StatusIcon = statusInfo.icon;

                                                return (
                                                    <div key={record.id} className="space-y-3">
                                                        {/* 日付とステータス */}
                                                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} className="text-blue-500" />
                                                                <h3 className="font-semibold text-gray-900">
                                                                    {format(new Date(date), 'M月d日(E)', { locale: ja })}
                                                                </h3>
                                                            </div>
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusInfo.color}`}>
                                                                <StatusIcon size={16} className={statusInfo.iconColor} />
                                                                <span className="font-medium text-sm">{statusInfo.label}</span>
                                                            </div>
                                                        </div>

                                                        {/* 予定時刻 */}
                                                        {(record.scheduled_arrival_time || record.scheduled_departure_time) && (
                                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                                <div className="text-xs font-semibold text-blue-700 mb-2">予定時刻</div>
                                                                <div className="flex flex-wrap gap-4 text-sm">
                                                                    {record.scheduled_arrival_time && (
                                                                        <div className="flex items-center gap-2 text-blue-700">
                                                                            <Clock size={14} />
                                                                            <span>登園予定: {record.scheduled_arrival_time.slice(0, 5)}</span>
                                                                        </div>
                                                                    )}
                                                                    {record.scheduled_departure_time && (
                                                                        <div className="flex items-center gap-2 text-blue-700">
                                                                            <Clock size={14} />
                                                                            <span>降園予定: {record.scheduled_departure_time.slice(0, 5)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 実際の時刻 */}
                                                        {(record.actual_arrival_time || record.actual_departure_time) && (
                                                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                                <div className="text-xs font-semibold text-green-700 mb-2">実際の時刻</div>
                                                                <div className="flex flex-wrap gap-4 text-sm">
                                                                    {record.actual_arrival_time && (
                                                                        <div className="flex items-center gap-2 text-green-700">
                                                                            <Clock size={14} />
                                                                            <span className="font-medium">登園: {record.actual_arrival_time.slice(0, 5)}</span>
                                                                        </div>
                                                                    )}
                                                                    {record.actual_departure_time && (
                                                                        <div className="flex items-center gap-2 text-green-700">
                                                                            <Clock size={14} />
                                                                            <span className="font-medium">降園: {record.actual_departure_time.slice(0, 5)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* メモ（本人の様子・活動内容） */}
                                                        {record.notes && (
                                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                                <div className="text-xs font-semibold text-gray-700 mb-2">記録内容</div>
                                                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                                    {record.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
              size: A4;
            }
          }
        `}
            </style>
        </div>
    );
};

export default MonthlyAttendanceByChild;


