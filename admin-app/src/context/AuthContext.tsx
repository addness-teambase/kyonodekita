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
                        // データベースから管理者情報を再確認（統合データベース対応）
                        const { data: dbUser, error } = await supabase
                            .from('users')
                            .select('id, username, user_type, display_name')
                            .eq('id', userData.id)
                            .eq('user_type', 'facility_admin')
                            .single();

                        if (dbUser && !error) {
                            console.log('管理者ユーザー確認成功:', dbUser.username);

                            // 管理者が管理する施設情報を取得
                            const { data: facilityData, error: facilityError } = await supabase
                                .from('facilities')
                                .select('id, name, address, phone, email')
                                .eq('admin_user_id', dbUser.id)
                                .maybeSingle();

                            if (facilityError) {
                                console.warn('施設情報取得エラー:', facilityError);
                            }

                            // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
                            const userWithFacility: User = {
                                id: dbUser.id,
                                username: dbUser.username,
                                facility: {
                                    name: facilityData?.name || 'きょうのできた保育園',
                                    adminName: dbUser.display_name || dbUser.username,
                                    address: facilityData?.address || undefined,
                                    phone: facilityData?.phone || undefined,
                                    email: facilityData?.email || undefined
                                }
                            };
                            console.log('管理者情報復元完了:', {
                                username: dbUser.username,
                                facilityName: facilityData?.name,
                                facilityId: facilityData?.id
                            });
                            setUser(userWithFacility);
                        } else {
                            console.warn('管理者情報の確認に失敗:', error?.message);
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

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // 既存ユーザーチェック（再登録の場合は上書き）
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id, user_type')
                .eq('username', username)
                .maybeSingle();

            let newUser;
            let isUpdate = false;

            if (existingUser) {
                console.log('既存ユーザー発見 - データを更新:', username);
                // 既存ユーザーのデータを更新（再登録を許可）
                const { data: updatedUser, error: updateError } = await supabase
                    .from('users')
                    .update({
                        password: hashedPassword,
                        user_type: 'facility_admin',
                        display_name: username,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingUser.id)
                    .select('id, username, user_type, display_name')
                    .single();

                if (updateError) {
                    console.error('ユーザー更新エラー:', updateError);
                    return { success: false, error: 'アカウント更新に失敗しました。' };
                }

                newUser = updatedUser;
                isUpdate = true;
            } else {
                // 新規ユーザーを作成
                const { data: createdUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        username: username,
                        password: hashedPassword,
                        user_type: 'facility_admin',
                        display_name: username
                    })
                    .select('id, username, user_type, display_name')
                    .single();

                if (createError) {
                    console.error('ユーザー作成エラー:', createError);
                    return { success: false, error: 'アカウント作成に失敗しました。' };
                }

                newUser = createdUser;
            }

            if (newUser) {
                console.log(isUpdate ? '管理者ユーザー更新成功:' : '管理者ユーザー作成成功:', newUser.id);

                // 既存の施設があるかチェック
                let newFacility;
                const { data: existingFacility, error: existingFacilityError } = await supabase
                    .from('facilities')
                    .select('id, name, address, phone, email')
                    .eq('admin_user_id', newUser.id)
                    .maybeSingle();

                if (existingFacility && !existingFacilityError) {
                    console.log('既存の施設を使用:', existingFacility.name);
                    newFacility = existingFacility;
                } else {
                    // 管理者用の施設を新規作成
                    const facilityCode = `FAC-${newUser.id.slice(0, 8)}-${Date.now()}`;
                    const { data: createdFacility, error: facilityError } = await supabase
                        .from('facilities')
                        .insert({
                            name: `${newUser.display_name || newUser.username}の施設`,
                            facility_code: facilityCode,
                            admin_user_id: newUser.id,
                            business_type: 'daycare'
                        })
                        .select('id, name, address, phone, email')
                        .single();

                    if (facilityError) {
                        console.error('施設作成エラー:', facilityError);
                        // 施設作成に失敗した場合でもユーザー作成は成功とする
                    } else {
                        console.log('新しい施設作成成功:', createdFacility?.name);
                    }

                    newFacility = createdFacility;
                }

                // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
                const userWithFacility: User = {
                    id: newUser.id,
                    username: newUser.username,
                    facility: {
                        name: newFacility?.name || `${newUser.username}の施設`,
                        adminName: newUser.display_name || newUser.username,
                        address: newFacility?.address || undefined,
                        phone: newFacility?.phone || undefined,
                        email: newFacility?.email || undefined
                    }
                };

                console.log('アカウント作成完了:', userWithFacility);
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

            // 管理者認証（統合データベース対応）
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, username, user_type, display_name')
                .eq('username', username)
                .eq('password', hashedPassword)
                .eq('user_type', 'facility_admin')
                .single();

            if (error || !userData) {
                console.warn('管理者ログインエラー:', error?.message || '管理者データが見つかりません');

                // 既存ユーザーの修復を試行
                console.log('フォールバック認証を試行...');
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('users')
                    .select('id, username, user_type, display_name')
                    .eq('username', username)
                    .eq('password', hashedPassword)
                    .single();

                if (fallbackData && !fallbackError) {
                    console.log('フォールバックで見つかったユーザー:', fallbackData);

                    // user_typeを修正
                    if (fallbackData.user_type !== 'facility_admin') {
                        console.log('user_typeを修正します:', fallbackData.user_type, '→ facility_admin');
                        const { error: updateError } = await supabase
                            .from('users')
                            .update({ user_type: 'facility_admin' })
                            .eq('id', fallbackData.id);

                        if (updateError) {
                            console.error('user_type更新エラー:', updateError);
                        } else {
                            fallbackData.user_type = 'facility_admin';
                            console.log('user_typeを更新しました');
                        }
                    }

                    // 施設情報を取得/作成
                    let { data: facilityData, error: facilityError } = await supabase
                        .from('facilities')
                        .select('id, name, address, phone, email')
                        .eq('admin_user_id', fallbackData.id)
                        .maybeSingle();

                    if (!facilityData && !facilityError) {
                        console.log('施設が存在しないため作成します...');
                        const facilityCode = `FAC-${fallbackData.id.slice(0, 8)}-${Date.now()}`;
                        const { data: newFacility, error: createError } = await supabase
                            .from('facilities')
                            .insert({
                                name: `${fallbackData.display_name || fallbackData.username}の施設`,
                                facility_code: facilityCode,
                                admin_user_id: fallbackData.id,
                                business_type: 'daycare'
                            })
                            .select('id, name, address, phone, email')
                            .single();

                        if (!createError && newFacility) {
                            facilityData = newFacility;
                            console.log('施設を作成しました:', newFacility.name);
                        }
                    }

                    // 管理者オブジェクトを作成
                    const userWithFacility = {
                        id: fallbackData.id,
                        username: fallbackData.username,
                        facility: {
                            name: facilityData?.name || `${fallbackData.username}の施設`,
                            adminName: fallbackData.display_name || fallbackData.username,
                            address: facilityData?.address || undefined,
                            phone: facilityData?.phone || undefined,
                            email: facilityData?.email || undefined
                        }
                    };

                    console.log('フォールバックログイン成功:', userWithFacility);
                    setUser(userWithFacility);
                    localStorage.setItem('kyou-no-dekita-user', JSON.stringify(userWithFacility));
                    return { success: true };
                }

                return {
                    success: false,
                    error: 'ユーザー名またはパスワードが間違っています。新規登録が必要な場合があります。'
                };
            }

            console.log('管理者認証成功:', userData.username);

            // 管理者が管理する施設情報を取得
            const { data: facilityData, error: facilityError } = await supabase
                .from('facilities')
                .select('id, name, address, phone, email')
                .eq('admin_user_id', userData.id)
                .maybeSingle();

            if (facilityError) {
                console.warn('施設情報取得エラー:', facilityError);
            }

            // 管理者用のユーザーオブジェクトを作成（facility情報を含む）
            const userWithFacility: User = {
                id: userData.id,
                username: userData.username,
                facility: {
                    name: facilityData?.name || 'きょうのできた保育園',
                    adminName: userData.display_name || userData.username,
                    address: facilityData?.address || undefined,
                    phone: facilityData?.phone || undefined,
                    email: facilityData?.email || undefined
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