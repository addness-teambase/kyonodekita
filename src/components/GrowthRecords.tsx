import React, { useState } from 'react';
import { Plus, Star, Heart, Trophy, Camera, Trash2, Edit3, MoreVertical } from 'lucide-react';
import { useRecord } from '../context/RecordContext';

const GrowthRecords: React.FC = () => {
    const { childInfo } = useRecord();
    const [growthRecords, setGrowthRecords] = useState<{
        id: string;
        date: Date;
        title: string;
        description: string;
        category: 'first_time' | 'milestone' | 'achievement' | 'memory';
        createdAt: Date;
    }[]>([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<string | null>(null);
    const [newRecord, setNewRecord] = useState({
        title: '',
        description: '',
        category: 'first_time' as 'first_time' | 'milestone' | 'achievement' | 'memory'
    });

    const categoryOptions = [
        { id: 'first_time', label: 'はじめてできたこと', icon: <Star className="w-5 h-5" />, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
        { id: 'milestone', label: '成長の節目', icon: <Trophy className="w-5 h-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
        { id: 'achievement', label: '頑張ったこと', icon: <Heart className="w-5 h-5" />, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
        { id: 'memory', label: '思い出', icon: <Camera className="w-5 h-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
    ];

    const handleAddRecord = () => {
        if (!newRecord.title.trim()) return;

        const record = {
            id: Date.now().toString(),
            date: new Date(),
            title: newRecord.title.trim(),
            description: newRecord.description.trim(),
            category: newRecord.category,
            createdAt: new Date()
        };

        setGrowthRecords(prev => [record, ...prev]);
        setNewRecord({ title: '', description: '', category: 'first_time' });
        setShowAddModal(false);
    };

    const handleEditRecord = (recordId: string) => {
        const record = growthRecords.find(r => r.id === recordId);
        if (record) {
            setNewRecord({
                title: record.title,
                description: record.description,
                category: record.category
            });
            setRecordToEdit(recordId);
            setShowEditModal(true);
            setShowActionMenu(null);
        }
    };

    const handleUpdateRecord = () => {
        if (!newRecord.title.trim() || !recordToEdit) return;

        setGrowthRecords(prev => prev.map(record =>
            record.id === recordToEdit
                ? {
                    ...record,
                    title: newRecord.title.trim(),
                    description: newRecord.description.trim(),
                    category: newRecord.category
                }
                : record
        ));

        setNewRecord({ title: '', description: '', category: 'first_time' });
        setRecordToEdit(null);
        setShowEditModal(false);
    };

    const handleDeleteRecord = (recordId: string) => {
        setRecordToDelete(recordId);
        setShowDeleteModal(true);
        setShowActionMenu(null);
    };

    const confirmDelete = () => {
        if (recordToDelete) {
            setGrowthRecords(prev => prev.filter(record => record.id !== recordToDelete));
            setRecordToDelete(null);
        }
        setShowDeleteModal(false);
    };

    const resetModal = () => {
        setNewRecord({ title: '', description: '', category: 'first_time' });
        setRecordToEdit(null);
    };

    const getCategoryInfo = (category: string) => {
        return categoryOptions.find(opt => opt.id === category) || categoryOptions[0];
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">成長記録</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {childInfo?.name}の成長の記録
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>

            {/* コンテンツ */}
            <div className="px-4 py-6">
                {growthRecords.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🌱</div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            まだ記録がありません
                        </h3>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                            お子さんの成長の瞬間を<br />
                            記録してみましょう
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                        >
                            最初の記録を追加
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {growthRecords.map((record) => {
                            const categoryInfo = getCategoryInfo(record.category);
                            return (
                                <div
                                    key={record.id}
                                    className={`${categoryInfo.bgColor} ${categoryInfo.borderColor} border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`${categoryInfo.color} p-2 rounded-xl bg-white/70`}>
                                            {categoryInfo.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-12">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`${categoryInfo.color} text-sm font-medium`}>
                                                    {categoryInfo.label}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(record.date)}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                                                {record.title}
                                            </h3>
                                            {record.description && (
                                                <p className="text-gray-700 leading-relaxed">
                                                    {record.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {/* 三点メニューボタン */}
                                    <div className="absolute top-4 right-4">
                                        <button
                                            onClick={() => setShowActionMenu(showActionMenu === record.id ? null : record.id)}
                                            className="p-2 rounded-full bg-white/80 hover:bg-white border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors shadow-sm"
                                            aria-label="アクションメニュー"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* アクションメニュー */}
                                        {showActionMenu === record.id && (
                                            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 min-w-32">
                                                <button
                                                    onClick={() => handleEditRecord(record.id)}
                                                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Edit3 size={16} className="text-blue-600" />
                                                    <span className="text-sm font-medium text-gray-700">編集</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecord(record.id)}
                                                    className="w-full px-4 py-3 text-left flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                    <span className="text-sm font-medium text-gray-700">削除</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 背景クリックでメニューを閉じる */}
            {showActionMenu && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionMenu(null)}
                />
            )}

            {/* 記録追加モーダル */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl mx-4 w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">
                                成長記録を追加
                            </h2>

                            {/* カテゴリー選択 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    カテゴリー
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categoryOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setNewRecord({ ...newRecord, category: option.id as any })}
                                            className={`p-3 rounded-xl border-2 transition-all duration-200 ${newRecord.category === option.id
                                                    ? `${option.bgColor} ${option.borderColor} ${option.color}`
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center space-y-1">
                                                {option.icon}
                                                <span className="text-xs font-medium">
                                                    {option.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* タイトル */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    タイトル *
                                </label>
                                <input
                                    type="text"
                                    value={newRecord.title}
                                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                                    placeholder="例: はじめて歩いた"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                                />
                            </div>

                            {/* 詳細説明 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    詳細説明
                                </label>
                                <textarea
                                    value={newRecord.description}
                                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                                    placeholder="詳しい内容や感想を記録しましょう..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base resize-none"
                                />
                            </div>

                            {/* ボタン */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetModal();
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleAddRecord}
                                    disabled={!newRecord.title.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${newRecord.title.trim()
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg active:scale-95'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    追加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 記録編集モーダル */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl mx-4 w-full max-w-md shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">
                                成長記録を編集
                            </h2>

                            {/* カテゴリー選択 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    カテゴリー
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categoryOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setNewRecord({ ...newRecord, category: option.id as any })}
                                            className={`p-3 rounded-xl border-2 transition-all duration-200 ${newRecord.category === option.id
                                                    ? `${option.bgColor} ${option.borderColor} ${option.color}`
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center space-y-1">
                                                {option.icon}
                                                <span className="text-xs font-medium">
                                                    {option.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* タイトル */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    タイトル *
                                </label>
                                <input
                                    type="text"
                                    value={newRecord.title}
                                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                                    placeholder="例: はじめて歩いた"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                />
                            </div>

                            {/* 詳細説明 */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    詳細説明
                                </label>
                                <textarea
                                    value={newRecord.description}
                                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                                    placeholder="詳しい内容や感想を記録しましょう..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                                />
                            </div>

                            {/* ボタン */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetModal();
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleUpdateRecord}
                                    disabled={!newRecord.title.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${newRecord.title.trim()
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg active:scale-95'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    更新
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 削除確認モーダル */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl mx-4 w-full max-w-sm shadow-2xl">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} className="text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">
                                    記録を削除しますか？
                                </h2>
                                <p className="text-gray-600">
                                    この操作は取り消すことができません
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-200 active:scale-95"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrowthRecords; 