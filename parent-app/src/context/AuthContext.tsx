import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    username: string;
    facility?: {
        name: string;
        adminName: string;
    };
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
                            console.warn('DBでユーザーを再確認できませんでした。ローカルの情報を削除します。');
                            localStorage.removeItem('kyou-no-dekita-user');
                        }
                    } else {
                        console.log('無効なユーザーデータ。ローカルデータを削除します。');
                        localStorage.removeItem('kyou-no-dekita-user');
                    }
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



    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            console.log('ログイン開始:', { username });

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // ユーザーを認証
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, username')
                .eq('username', username)
                .eq('password', hashedPassword)
                .single();

            if (error || !userData) {
                console.warn('Supabaseログインエラー:', error?.message || 'ユーザーデータが見つかりません');
                return {
                    success: false,
                    error: 'ユーザー名またはパスワードが間違っています'
                };
            }

            console.log('Supabaseログイン成功:', userData.id);
            setUser(userData);
            localStorage.setItem('kyou-no-dekita-user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error('予期しないログインエラー:', error);
            return {
                success: false,
                error: 'システムエラーが発生しました。'
            };
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
            logout,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}; 