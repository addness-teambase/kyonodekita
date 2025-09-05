import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    username: string;
    display_name?: string;
    email?: string;
    user_type: string;
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

    // ログイン状態復元（リロード時もログイン維持）
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const storedUser = localStorage.getItem('kyou-no-dekita-user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log('既存のログイン情報を復元します:', parsedUser.username);
                    setUser(parsedUser);
                } else {
                    console.log('ログイン情報が見つかりません。ログアウト状態で開始します');
                    setUser(null);
                }
            } catch (error) {
                console.error('認証初期化エラー:', error);
                localStorage.removeItem('kyou-no-dekita-user'); // 破損したデータを削除
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);



    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            console.log('ログイン開始:', { username });

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // 親ユーザーを認証（user_type: 'parent'のみ）
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, username, display_name, email, user_type')
                .eq('username', username)
                .eq('password', hashedPassword)
                .eq('user_type', 'parent')
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