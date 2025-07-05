import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, AlertCircle, Heart } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('保護者名とパスワードを入力してください');
            return;
        }

        const success = await login(username, password);
        if (!success) {
            setError('ログインに失敗しました');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-orange-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                    {/* ヘッダー部分 - 育児アプリらしい優しいデザイン */}
                    <div className="bg-gradient-to-r from-pink-400 to-orange-300 p-8 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✨</span>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">きょうのできた</h1>
                            <p className="text-white/90 text-sm font-medium">お子さまとの大切な毎日を記録</p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">おかえりなさい</h2>
                            <p className="text-gray-500 text-sm">アカウントにログインしてください</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-3 animate-slideInRight border border-red-100">
                                    <AlertCircle size={20} className="flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                                    保護者名
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <User size={20} />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all duration-200 bg-gray-50 focus:bg-white"
                                        placeholder="保護者名を入力"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                                    パスワード
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all duration-200 bg-gray-50 focus:bg-white"
                                        placeholder="パスワードを入力"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-semibold py-4 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <Heart size={18} className="fill-current" />
                                        <span>ログイン</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-400">
                                育児の記録を大切に保存します
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 