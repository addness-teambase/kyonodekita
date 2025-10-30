import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);
            if (!result.success) {
                setError(result.error || 'ログインに失敗しました');
            }
        } catch (err) {
            setError('ログインに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* ヘッダー */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                            <Shield className="w-8 h-8 text-pink-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            スーパー管理者
                        </h1>
                        <p className="text-gray-600">
                            きょうのできた - システム管理
                        </p>
                    </div>

                    {/* エラーメッセージ */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* ログインフォーム */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                ユーザー名
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                placeholder="ユーザー名を入力"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                パスワード
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
                                placeholder="パスワードを入力"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'ログイン中...' : 'ログイン'}
                        </button>
                    </form>

                    {/* フッター */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-center text-gray-500">
                            スーパー管理者専用ページです。<br />
                            権限のないアクセスは記録されます。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};






