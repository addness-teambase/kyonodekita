import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Facility {
    id: string;
    name: string;
    adminName: string;
    createdAt: string;
}

interface User {
    id: string;
    facilityId: string;
    facility: Facility;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (facilityName: string, adminName: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (facilityName: string, adminName: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
    return btoa(password + 'kyou-no-dekita-admin-salt');
};

// ローカルストレージのキー
const STORAGE_KEYS = {
    facilities: 'kyou-no-dekita-facilities',
    currentUser: 'kyou-no-dekita-current-admin'
};

// UUIDのような一意IDを生成
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ローカルストレージからユーザー情報を読み込み
    useEffect(() => {
        const loadUserFromStorage = () => {
            try {
                const storedUser = localStorage.getItem(STORAGE_KEYS.currentUser);
                if (storedUser) {
                    const userData = JSON.parse(storedUser);

                    // ユーザーデータの基本的なバリデーション
                    if (userData && userData.id && userData.facilityId && userData.facility) {
                        console.log('管理者情報を復元しました:', userData.facility.name);
                        setUser(userData);
                    } else {
                        console.log('無効な管理者データ。ローカルデータを削除します。');
                        localStorage.removeItem(STORAGE_KEYS.currentUser);
                    }
                } else {
                    console.log('ローカルストレージに管理者情報がありません。');
                }
            } catch (error) {
                console.error('管理者読み込みエラー:', error);
                localStorage.removeItem(STORAGE_KEYS.currentUser);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserFromStorage();
    }, []);

    // ローカルストレージから事業所一覧を取得
    const getFacilitiesFromStorage = (): Array<{ id: string; name: string; adminName: string; password: string; createdAt: string }> => {
        try {
            const facilities = localStorage.getItem(STORAGE_KEYS.facilities);
            return facilities ? JSON.parse(facilities) : [];
        } catch (error) {
            console.error('事業所一覧の読み込みエラー:', error);
            return [];
        }
    };

    // ローカルストレージに事業所一覧を保存
    const saveFacilitiesToStorage = (facilities: Array<{ id: string; name: string; adminName: string; password: string; createdAt: string }>) => {
        try {
            localStorage.setItem(STORAGE_KEYS.facilities, JSON.stringify(facilities));
        } catch (error) {
            console.error('事業所一覧の保存エラー:', error);
        }
    };

    const signUp = async (facilityName: string, adminName: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            console.log('事業所登録開始:', { facilityName, adminName, passwordLength: password.length });

            if (!facilityName.trim()) {
                return { success: false, error: '事業所名を入力してください' };
            }

            if (!adminName.trim()) {
                return { success: false, error: '管理者名を入力してください' };
            }

            if (password.length < 6) {
                return { success: false, error: 'パスワードは6文字以上で入力してください' };
            }

            const facilities = getFacilitiesFromStorage();

            // 事業所名の重複チェック
            const existingFacility = facilities.find(f => f.name.toLowerCase() === facilityName.toLowerCase());
            if (existingFacility) {
                console.log('事業所名重複:', facilityName);
                return { success: false, error: 'この事業所名は既に使用されています' };
            }

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // 新しい事業所を作成
            const newFacility = {
                id: generateId(),
                name: facilityName,
                adminName: adminName,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            };

            // 事業所一覧に追加
            const updatedFacilities = [...facilities, newFacility];
            saveFacilitiesToStorage(updatedFacilities);

            // 現在のユーザーとして設定
            const userData: User = {
                id: generateId(),
                facilityId: newFacility.id,
                facility: {
                    id: newFacility.id,
                    name: newFacility.name,
                    adminName: newFacility.adminName,
                    createdAt: newFacility.createdAt
                }
            };

            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(userData));

            console.log('事業所登録成功:', newFacility.id);
            return { success: true };
        } catch (error) {
            console.error('登録エラー:', error);
            return { success: false, error: '登録に失敗しました' };
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (facilityName: string, adminName: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            setIsLoading(true);
            console.log('ログイン開始:', { facilityName, adminName, passwordLength: password.length });

            if (!facilityName.trim() || !adminName.trim() || !password.trim()) {
                return { success: false, error: '全ての項目を入力してください' };
            }

            const facilities = getFacilitiesFromStorage();

            // パスワードをハッシュ化
            const hashedPassword = hashPassword(password);

            // 事業所を認証
            const facilityData = facilities.find(f =>
                f.name.toLowerCase() === facilityName.toLowerCase() &&
                f.adminName === adminName &&
                f.password === hashedPassword
            );

            if (!facilityData) {
                console.error('ログインエラー: 事業所情報が見つかりません');
                return { success: false, error: '事業所名、管理者名、またはパスワードが間違っています' };
            }

            // 現在のユーザーとして設定
            const userData: User = {
                id: generateId(),
                facilityId: facilityData.id,
                facility: {
                    id: facilityData.id,
                    name: facilityData.name,
                    adminName: facilityData.adminName,
                    createdAt: facilityData.createdAt
                }
            };

            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(userData));

            console.log('ログイン成功:', facilityData.id);
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
            localStorage.removeItem(STORAGE_KEYS.currentUser);
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