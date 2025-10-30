import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// パスワードハッシュ関数（parent-appとadmin-appと同じ）
const hashPassword = (password: string): string => {
    let hash = 0;
    const salt = 'kyou-no-dekita-2024';
    const combined = salt + password + salt;

    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const storedUser = localStorage.getItem('super-admin-user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);

                    if (userData && userData.id && userData.username) {
                        // スーパー管理者権限を確認
                        const { data: dbUser, error } = await supabase
                            .from('users')
                            .select('id, username, user_type, display_name, email')
                            .eq('id', userData.id)
                            .eq('user_type', 'super_admin')
                            .single();

                        if (dbUser && !error) {
                            setUser(dbUser as User);
                        } else {
                            localStorage.removeItem('super-admin-user');
                        }
                    }
                }
            } catch (error) {
                console.error('ユーザー情報の読み込みエラー:', error);
                localStorage.removeItem('super-admin-user');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const hashedPassword = hashPassword(password);

            // スーパー管理者認証
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, username, user_type, display_name, email')
                .eq('username', username)
                .eq('password', hashedPassword)
                .eq('user_type', 'super_admin')
                .single();

            if (error || !userData) {
                return {
                    success: false,
                    error: 'ユーザー名またはパスワードが間違っています、またはスーパー管理者権限がありません'
                };
            }

            setUser(userData as User);
            localStorage.setItem('super-admin-user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error('ログインエラー:', error);
            return {
                success: false,
                error: 'ログインに失敗しました'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setUser(null);
            localStorage.removeItem('super-admin-user');
        } catch (error) {
            console.error('ログアウトエラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};






