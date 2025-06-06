import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('ユーザー名とパスワードを入力してください');
            return;
        }

        const success = await login(username, password);
        if (!success) {
            setError('ログインに失敗しました');
        }
    };

    // LINE連携ログインの処理（現状はUIのみ）
    const handleLineLogin = () => {
        // 実際にはLINE認証APIを使用するが、現状はUIのみなのでアラートを表示
        alert('LINE連携ログイン機能は開発中です');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-500 to-orange-400 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-6 text-white text-center">
                        <h1 className="text-2xl font-bold mb-1">きょうのできた</h1>
                        <p className="text-white/80 text-sm">日々の感情を記録して、心の健康を管理</p>
                    </div>

                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">アカウントにログイン</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 animate-slideInRight">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    ユーザー名
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        placeholder="ユーザー名を入力"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    パスワード
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                                        placeholder="パスワードを入力"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>ログイン</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 relative flex items-center justify-center">
                            <div className="absolute w-full border-t border-gray-200"></div>
                            <div className="relative bg-white px-4">
                                <span className="text-sm text-gray-500">または</span>
                            </div>
                        </div>

                        {/* LINE連携ログインボタン */}
                        <button
                            onClick={handleLineLogin}
                            className="w-full mt-4 bg-[#06c755] hover:bg-[#05b54a] text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-md"
                        >
                            {/* LINE風アイコン */}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.9999 10.8004C21.9999 6.3966 17.3907 2.8252 11.6556 2.8252C5.92033 2.8252 1.31116 6.3966 1.31116 10.8004C1.31116 14.7143 4.71324 18.0261 9.47955 18.6692C9.84176 18.7473 10.3395 18.9037 10.4552 19.2164C10.5607 19.5059 10.5195 19.956 10.4783 20.2422C10.4783 20.2422 10.3395 21.0204 10.3086 21.175C10.2671 21.4092 10.1081 22.2875 11.6556 21.6443C13.203 21.0011 18.3574 17.754 20.3982 15.0698C21.7078 13.435 21.9999 12.1944 21.9999 10.8004Z" fill="white" />
                                <path d="M18.0652 12.9348H16.2957C16.1492 12.9348 16.0304 12.8161 16.0304 12.6696V9.88269C16.0304 9.73621 16.1492 9.61746 16.2957 9.61746C16.4422 9.61746 16.561 9.73621 16.561 9.88269V12.4043H18.0653C18.2118 12.4043 18.3306 12.523 18.3306 12.6695C18.3306 12.816 18.2118 12.9348 18.0653 12.9348H18.0652Z" fill="#06c755" />
                                <path d="M9.15234 12.9348C9.00586 12.9348 8.88711 12.8161 8.88711 12.6696V9.88269C8.88711 9.73621 9.00586 9.61746 9.15234 9.61746C9.29883 9.61746 9.41758 9.73621 9.41758 9.88269V12.6696C9.41758 12.8161 9.29883 12.9348 9.15234 12.9348Z" fill="#06c755" />
                                <path d="M14.0869 12.9348C13.9404 12.9348 13.8217 12.8161 13.8217 12.6696V10.6348L12.2315 12.7665C12.1739 12.8448 12.0877 12.8861 12.0016 12.8861C11.9155 12.8861 11.8294 12.8448 11.7717 12.7665L10.1815 10.6348V12.6696C10.1815 12.8161 10.0628 12.9348 9.91629 12.9348C9.7698 12.9348 9.65105 12.8161 9.65105 12.6696V9.88269C9.65105 9.77551 9.71285 9.67924 9.81074 9.63832C9.90863 9.5974 10.0217 9.61746 10.1 9.69051L12.0016 12.2496L13.9033 9.69051C13.9815 9.61746 14.0946 9.5974 14.1925 9.63832C14.2904 9.67924 14.3522 9.77551 14.3522 9.88269V12.6696C14.3522 12.8161 14.2334 12.9348 14.0869 12.9348Z" fill="#06c755" />
                                <path d="M7.57607 12.9348H5.80651C5.66002 12.9348 5.54128 12.8161 5.54128 12.6696V9.88269C5.54128 9.73621 5.66002 9.61746 5.80651 9.61746H7.57607C7.72255 9.61746 7.8413 9.73621 7.8413 9.88269C7.8413 10.0292 7.72255 10.1479 7.57607 10.1479H6.07172V10.9261H7.57607C7.72255 10.9261 7.8413 11.0448 7.8413 11.1913C7.8413 11.3378 7.72255 11.4565 7.57607 11.4565H6.07172V12.4043H7.57607C7.72255 12.4043 7.8413 12.523 7.8413 12.6695C7.8413 12.816 7.72255 12.9348 7.57607 12.9348Z" fill="#06c755" />
                            </svg>
                            <span>LINEでログイン</span>
                        </button>
                    </div>
                </div>

                <p className="text-center text-white/80 text-sm mt-6">
                    初めての方は管理者にアカウントの作成を依頼してください
                </p>
            </div>
        </div>
    );
};

export default LoginPage; 