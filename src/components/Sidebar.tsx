import React, { useState } from 'react';
import { useStress } from '../context/StressContext';
import { useAuth } from '../context/AuthContext';
import {
    Menu, X, Smile, Brain, BarChart2, History, Settings,
    User, LogOut, Home, Calendar, Moon, Sun
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogoutClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onLogoutClick }) => {
    const { recordMode, setRecordMode } = useStress();
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<'home' | 'analytics' | 'history' | 'settings'>('home');
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        // 実際の実装ではここでダークモードの設定を変更する
    };

    const handleViewChange = (view: 'home' | 'analytics' | 'history' | 'settings') => {
        setActiveView(view);
        // 実装ではここで表示するビューを変更する
    };

    return (
        <>
            {/* オーバーレイ */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* サイドバー */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <h2 className="text-lg font-bold text-orange-500">きょうのできた</h2>
                        <button
                            onClick={onClose}
                            className="md:hidden p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ユーザー情報 */}
                    {user && (
                        <div className="flex items-center gap-2 p-4 border-b">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <User size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{user.username}</p>
                                <p className="text-xs text-gray-500">ユーザー</p>
                            </div>
                        </div>
                    )}

                    {/* モード切替 */}
                    <div className="p-4 border-b">
                        <p className="text-xs font-medium text-gray-500 mb-2">記録モード</p>
                        <div className="bg-gray-100 rounded-lg p-1 flex">
                            <button
                                onClick={() => setRecordMode('stress')}
                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'stress'
                                        ? 'bg-white text-orange-500 shadow-sm'
                                        : 'bg-transparent text-gray-600 hover:bg-white/50'
                                    }`}
                            >
                                <Brain size={14} />
                                <span>不安</span>
                            </button>
                            <button
                                onClick={() => setRecordMode('good')}
                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${recordMode === 'good'
                                        ? 'bg-white text-orange-500 shadow-sm'
                                        : 'bg-transparent text-gray-600 hover:bg-white/50'
                                    }`}
                            >
                                <Smile size={14} />
                                <span>良いこと</span>
                            </button>
                        </div>
                    </div>

                    {/* ナビゲーション */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">メニュー</p>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => handleViewChange('home')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'home'
                                            ? 'bg-orange-50 text-orange-500'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Home size={16} />
                                    <span>ホーム</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleViewChange('analytics')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'analytics'
                                            ? 'bg-orange-50 text-orange-500'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <BarChart2 size={16} />
                                    <span>分析</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleViewChange('history')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'history'
                                            ? 'bg-orange-50 text-orange-500'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <History size={16} />
                                    <span>履歴</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleViewChange('settings')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeView === 'settings'
                                            ? 'bg-orange-50 text-orange-500'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Settings size={16} />
                                    <span>設定</span>
                                </button>
                            </li>
                        </ul>
                    </nav>

                    {/* フッター */}
                    <div className="p-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500">ダークモード</span>
                            <button
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-orange-500' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                                {darkMode ? (
                                    <Moon size={12} className="absolute right-1 text-orange-100" />
                                ) : (
                                    <Sun size={12} className="absolute left-1 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <button
                            onClick={onLogoutClick}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={16} />
                            <span>ログアウト</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar; 