import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
  self_introduction: string;
  description: string;
  consultation_fee: number;
  timerex_url: string;
}

interface User {
  id: string;
  username: string;
  expert: Expert | null;
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
        const storedUser = localStorage.getItem('expert-admin-user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);

          if (userData && userData.id && userData.username) {
            // データベースから専門家情報を再確認
            const { data: dbUser, error } = await supabase
              .from('users')
              .select('id, username, user_type, display_name')
              .eq('id', userData.id)
              .single();

            if (dbUser && !error) {
              // 専門家情報を取得
              const { data: expertData, error: expertError } = await supabase
                .from('experts')
                .select('*')
                .eq('admin_user_id', dbUser.id)
                .eq('is_active', true)
                .maybeSingle();

              if (expertError) {
                console.warn('専門家情報取得エラー:', expertError);
              }

              const userWithExpert: User = {
                id: dbUser.id,
                username: dbUser.username,
                expert: expertData || null
              };

              setUser(userWithExpert);
            } else {
              console.warn('ユーザー確認失敗:', error);
              localStorage.removeItem('expert-admin-user');
            }
          }
        }
      } catch (error) {
        console.error('ユーザー情報の読み込みエラー:', error);
        localStorage.removeItem('expert-admin-user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // デモログイン機能（テーブルがない場合用）
      if (username === 'demo' && password === 'demo') {
        const demoUser: User = {
          id: 'demo-user-id',
          username: 'demo',
          expert: null
        };
        setUser(demoUser);
        localStorage.setItem('expert-admin-user', JSON.stringify({
          id: 'demo-user-id',
          username: 'demo'
        }));
        return { success: true };
      }

      const hashedPassword = hashPassword(password);

      // ユーザー認証
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, password, user_type, display_name')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        // テーブルが存在しない場合もデモログインを許可
        if (userError?.code === '42P01' && username === 'demo' && password === 'demo') {
          const demoUser: User = {
            id: 'demo-user-id',
            username: 'demo',
            expert: null
          };
          setUser(demoUser);
          localStorage.setItem('expert-admin-user', JSON.stringify({
            id: 'demo-user-id',
            username: 'demo'
          }));
          return { success: true };
        }
        return { success: false, error: 'ユーザー名またはパスワードが違います' };
      }

      if (userData.password !== hashedPassword) {
        return { success: false, error: 'ユーザー名またはパスワードが違います' };
      }

      // 専門家情報を取得
      const { data: expertData, error: expertError } = await supabase
        .from('experts')
        .select('*')
        .eq('admin_user_id', userData.id)
        .eq('is_active', true)
        .maybeSingle();

      if (expertError && expertError.code !== 'PGRST116') {
        console.warn('専門家情報取得エラー:', expertError);
      }

      const userWithExpert: User = {
        id: userData.id,
        username: userData.username,
        expert: expertData || null
      };

      setUser(userWithExpert);
      localStorage.setItem('expert-admin-user', JSON.stringify({
        id: userData.id,
        username: userData.username
      }));

      return { success: true };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, error: 'ログイン中にエラーが発生しました' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('expert-admin-user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

