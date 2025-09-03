import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Facility {
    name: string;
    adminName: string;
    address?: string;
    phone?: string;
    email?: string;
}

interface User {
    id: string;
    username: string;
    facility: Facility;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    updateUserInfo: (facilityInfo: Partial<Facility>) => Promise<void>;
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
    return btoa(password + 'kyou-no-dekita-salt'); // parent-appとsaltを合わせる
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ローカルストレージからユーザー情報を読み込み
    useEffect(() => {
        const loadUserFromStorage = async () => {
            try {
                const storedUser = localStorage.getItem('kyou-no-dekita-user'); // parent-appとキーを合わせる
                if (storedUser) {
                    const userData = JSON.parse(storedUser);

                    if (userData && userData.id && userData.username) {
                        // データベースからユーザー情報を再確認
                        const { data: dbUser, error } = await supabase
                            .from('users')
                            .select('id, username')
                            .eq('id', userData.id)
                            .single();

                        if (dbUser && !error) {
                            // データベースから詳細な施設情報を取得
                            const { data: userDetails } = await supabase
                                .from('users')
                                .select('facility_name, display_name, facility_address, facility_phone, facility_email')
                                .eq('id', dbUser.id)
                                .single();

                            // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
                            const userWithFacility: User = {
                                id: dbUser.id,
                                username: dbUser.username,
                                facility: {
                                    name: userDetails?.facility_name || 'きょうのできた',
                                    adminName: userDetails?.display_name || dbUser.username,
                                    address: userDetails?.facility_address || undefined,
                                    phone: userDetails?.facility_phone || undefined,
                                    email: userDetails?.facility_email || undefined
                                }
                            };
                            console.log('ユーザー情報を復元しました:', dbUser.username);
                            setUser(userWithFacility);
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

    const signUp = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            console.log('サインアップ開始:', { username });

            // ユーザー名の重複チェック
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116は結果が0件だった場合のエラー
                console.error('ユーザー名重複チェックエラー:', checkError);
                return { success: false, error: 'データベースエラーが発生しました。' };
            }

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

            if (error) {
                console.error('Supabaseサインアップエラー:', error);
                return { success: false, error: 'アカウント作成に失敗しました。' };
            }

            if (newUser) {
                // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
                const userWithFacility: User = {
                    id: newUser.id,
                    username: newUser.username,
                    facility: {
                        name: 'きょうのできた',
                        adminName: newUser.username // ユーザー名を管理者名として使用
                    }
                };
                console.log('ユーザー作成成功:', newUser.id);
                setUser(userWithFacility);
                localStorage.setItem('kyou-no-dekita-user', JSON.stringify(userWithFacility));
                return { success: true };
            }

            return { success: false, error: '登録に失敗しました' };
        } catch (error) {
            console.error('登録エラー:', error);
            return { success: false, error: '予期しないエラーが発生しました。' };
        } finally {
            setIsLoading(false);
        }
    };

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

            // データベースから詳細な施設情報を取得
            const { data: userDetails } = await supabase
                .from('users')
                .select('facility_name, display_name, facility_address, facility_phone, facility_email')
                .eq('id', userData.id)
                .single();

            // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
            const userWithFacility: User = {
                id: userData.id,
                username: userData.username,
                facility: {
                    name: userDetails?.facility_name || 'きょうのできた',
                    adminName: userDetails?.display_name || userData.username,
                    address: userDetails?.facility_address || undefined,
                    phone: userDetails?.facility_phone || undefined,
                    email: userDetails?.facility_email || undefined
                }
            };
            console.log('Supabaseログイン成功:', userData.id);
            setUser(userWithFacility);
            localStorage.setItem('kyou-no-dekita-user', JSON.stringify(userWithFacility));
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

    const updateUserInfo = async (facilityInfo: Partial<Facility>): Promise<void> => {
        if (!user) return;

        try {
            const updatedUser: User = {
                ...user,
                facility: {
                    ...user.facility,
                    ...facilityInfo
                }
            };

            setUser(updatedUser);
            localStorage.setItem('kyou-no-dekita-user', JSON.stringify(updatedUser));
            console.log('ユーザー情報を更新しました:', facilityInfo);
        } catch (error) {
            console.error('ユーザー情報更新エラー:', error);
            throw error;
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
            updateUserInfo,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};