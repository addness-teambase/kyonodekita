import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, Facility, FacilityStats } from '../lib/supabase';
import {
    Building2,
    Users,
    TrendingUp,
    Calendar,
    Trash2,
    LogOut,
    RefreshCw,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [stats, setStats] = useState<FacilityStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError('');

        try {
            // 施設一覧を取得
            const { data: facilitiesData, error: facilitiesError } = await supabase
                .from('facilities')
                .select(`
          *,
          users:admin_user_id (
            display_name,
            username
          )
        `)
                .order('created_at', { ascending: false });

            if (facilitiesError) throw facilitiesError;

            // 各施設のユーザー数を取得
            const facilitiesWithCount = await Promise.all(
                (facilitiesData || []).map(async (facility) => {
                    const { count } = await supabase
                        .from('facility_memberships')
                        .select('*', { count: 'exact', head: true })
                        .eq('facility_id', facility.id);

                    return {
                        ...facility,
                        user_count: count || 0,
                        admin_name: facility.users?.display_name || facility.users?.username || '未設定'
                    };
                })
            );

            setFacilities(facilitiesWithCount);

            // 統計情報を計算
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const newFacilitiesCount = facilitiesWithCount.filter(f =>
                new Date(f.created_at) >= firstDayOfMonth
            ).length;

            const totalUsers = facilitiesWithCount.reduce((sum, f) => sum + (f.user_count || 0), 0);
            const activeFacilities = facilitiesWithCount.filter(f => f.is_active).length;

            setStats({
                total_facilities: facilitiesWithCount.length,
                total_users: totalUsers,
                active_facilities: activeFacilities,
                new_facilities_this_month: newFacilitiesCount
            });
        } catch (err) {
            console.error('データ読み込みエラー:', err);
            setError('データの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (facilityId: string) => {
        if (deleteConfirm !== facilityId) {
            setDeleteConfirm(facilityId);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            const { error } = await supabase
                .from('facilities')
                .delete()
                .eq('id', facilityId);

            if (error) throw error;

            await loadData();
            setDeleteConfirm(null);
        } catch (err) {
            console.error('削除エラー:', err);
            setError('施設の削除に失敗しました');
        }
    };

    const handleLogout = async () => {
        if (window.confirm('ログアウトしますか？')) {
            await logout();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                スーパー管理者ダッシュボード
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                ようこそ、{user?.display_name || user?.username}さん
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadData}
                                disabled={isLoading}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="更新"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>ログアウト</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* エラーメッセージ */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* 統計カード */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">総施設数</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_facilities}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">総ユーザー数</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">有効施設</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active_facilities}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-pink-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">今月の新規</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.new_facilities_this_month}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 施設一覧 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">施設一覧</h2>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">読み込み中...</p>
                        </div>
                    ) : facilities.length === 0 ? (
                        <div className="p-12 text-center">
                            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">施設がありません</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            施設名
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            管理者
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ユーザー数
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ステータス
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            作成日
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            最終更新
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {facilities.map((facility) => (
                                        <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {facility.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {facility.facility_code}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{facility.admin_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{facility.user_count} 人</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${facility.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {facility.is_active ? '有効' : '無効'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {format(new Date(facility.created_at), 'yyyy/MM/dd')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {format(new Date(facility.updated_at), 'yyyy/MM/dd HH:mm')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDelete(facility.id)}
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${deleteConfirm === facility.id
                                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {deleteConfirm === facility.id ? '本当に削除？' : '削除'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

