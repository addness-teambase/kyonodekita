import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, User, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [facilityName, setFacilityName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [success, setSuccess] = useState('');
    const { login, signUp, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!facilityName.trim() || !adminName.trim() || !password.trim()) {
            setError('全ての項目を入力してください');
            return;
        }

        if (facilityName.length < 2) {
            setError('事業所名は2文字以上で入力してください');
            return;
        }

        if (adminName.length < 2) {
            setError('管理者名は2文字以上で入力してください');
            return;
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            return;
        }

        try {
            if (mode === 'login') {
                console.log('ログイン試行:', { facilityName, adminName, password: '***' });

                // ローカルストレージの確認
                const facilities = localStorage.getItem('kyou-no-dekita-facilities');
                console.log('ローカルストレージの事業所データ:', facilities);

                const result = await login(facilityName, adminName, password);
                console.log('ログイン結果:', result);
                if (!result.success) {
                    setError(result.error || 'ログインに失敗しました');
                }
            } else {
                console.log('事業所登録試行:', { facilityName, adminName, password: '***' });
                const result = await signUp(facilityName, adminName, password);
                console.log('事業所登録結果:', result);
                if (result.success) {
                    setSuccess('事業所を登録しました！ログインしています...');
                } else {
                    setError(result.error || '事業所登録に失敗しました');
                }
            }
        } catch (error) {
            console.error('認証エラー:', error);
            setError('システムエラーが発生しました: ' + (error as Error).message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
                        <Building className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">今日のできた</h1>
                    <p className="text-gray-600 text-sm">管理者画面</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
                    <div className="mb-6">
                        <div className="flex bg-gray-100/80 rounded-2xl p-1 mb-6">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${mode === 'login'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                ログイン
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('signup')}
                                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${mode === 'signup'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                新規登録
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Facility Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                事業所名
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={facilityName}
                                    onChange={(e) => setFacilityName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all duration-200"
                                    placeholder="保育園やまもと"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Admin Name Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                管理者名
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all duration-200"
                                    placeholder="山本太郎"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                パスワード
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50/80 border-0 rounded-2xl text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-all duration-200"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                                <p className="text-sm text-green-700">{success}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-200 hover:from-pink-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    処理中...
                                </div>
                            ) : mode === 'login' ? (
                                'ログイン'
                            ) : (
                                '事業所を登録'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            安全なローカルストレージを使用しています
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 