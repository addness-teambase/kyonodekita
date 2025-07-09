import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// 簡単なパスワードハッシュ関数
const hashPassword = (password: string): string => {
    return btoa(password + 'kyou-no-dekita-salt');
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ローカルストレージからユーザー情報を読み込み
    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const storedUser = localStorage.getItem('kyou-no-dekita-user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);

                    // ユーザーデータの基本的なバリデーション
                    if (userData && userData.id && userData.username) {
                        try {
                            // データベースからユーザー情報を再確認
                            const { data: dbUser, error } = await supabase
                                .from('users')
                                .select('id, username')
                                .eq('id', userData.id)
                                .single();

                            if (dbUser && !error) {
                                console.log('ユーザー情報を復元しました:', dbUser.username);
                                setUser(dbUser);
                            } else {
                                console.log('データベースでユーザーが見つかりません。ローカルデータを削除します。');
                                localStorage.removeItem('kyou-no-dekita-user');
                            }
                        } catch (dbError) {
                            console.log('データベース接続エラー。ローカルデータを削除します:', dbError);
                            localStorage.removeItem('kyou-no-dekita-user');
                        }
                    } else {
                        console.log('無効なユーザーデータ。ローカルデータを削除します。');
                        localStorage.removeItem('kyou-no-dekita-user');
                    }
                } else {
                    console.log('ローカルストレージにユーザー情報がありません。');
                }
            } catch (error) {
                console.error('ユーザー読み込みエラー:', error);
                localStorage.removeItem('kyou-no-dekita-user');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    const signUp = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            console.log('サインアップ開始:', { username, passwordLength: password.length });

            // ユーザー名の重複チェック
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .single();

            if (existingUser) {
                console.log('ユーザー名重複:', username);
                return { success: false, error: 'このユーザー名は既に使用されています' };
            }

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // ユーザーを作成
            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username: username,
                    password: hashedPassword
                })
                .select('id, username')
                .single();

            console.log('サインアップ結果:', { newUser, error });

            if (error) {
                console.error('ユーザー作成エラー:', error);
                return { success: false, error: '登録に失敗しました' };
            }

            if (newUser) {
                console.log('ユーザー作成成功:', newUser.id);
                setUser(newUser);
                localStorage.setItem('kyou-no-dekita-user', JSON.stringify(newUser));
                return { success: true };
            }

            return { success: false, error: '登録に失敗しました' };
        } catch (error) {
            console.error('登録エラー:', error);
            return { success: false, error: '登録に失敗しました' };
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            console.log('ログイン開始:', { username, passwordLength: password.length });

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // ユーザーを認証
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, username')
                .eq('username', username)
                .eq('password', hashedPassword)
                .single();

            console.log('ログイン結果:', { userData, error });

            if (error || !userData) {
                console.error('ログインエラー:', error);
                return { success: false, error: 'ユーザー名またはパスワードが間違っています' };
            }

            console.log('ログイン成功:', userData.id);
            setUser(userData);
            localStorage.setItem('kyou-no-dekita-user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error('ログインエラー:', error);
            return { success: false, error: 'ログインに失敗しました' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setUser(null);
            localStorage.removeItem('kyou-no-dekita-user');
        } catch (error) {
            console.error('ログアウトエラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            login,
            signUp,
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}; 