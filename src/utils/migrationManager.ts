import { supabase } from '../lib/supabase';

// アプリケーションのバージョン管理
const APP_VERSION = '1.0.0';
const DB_VERSION_KEY = 'db_version';

// バージョン情報を保存
interface VersionInfo {
    app_version: string;
    db_version: string;
    last_updated: string;
}

// 現在のデータベースバージョンを取得
export const getCurrentDbVersion = (): string => {
    return localStorage.getItem(DB_VERSION_KEY) || '1.0.0';
};

// データベースバージョンを更新
export const updateDbVersion = (version: string): void => {
    localStorage.setItem(DB_VERSION_KEY, version);
};

// バージョン互換性チェック
export const checkVersionCompatibility = (userVersion: string, appVersion: string): boolean => {
    // セマンティックバージョニング（major.minor.patch）
    const [userMajor, userMinor] = userVersion.split('.').map(Number);
    const [appMajor, appMinor] = appVersion.split('.').map(Number);

    // メジャーバージョンが異なる場合は互換性なし
    if (userMajor !== appMajor) return false;

    // マイナーバージョンが大きく異なる場合は注意が必要
    if (Math.abs(userMinor - appMinor) > 2) return false;

    return true;
};

// データベースマイグレーション
export const performDatabaseMigration = async (fromVersion: string, toVersion: string): Promise<void> => {
    console.log(`Migrating database from ${fromVersion} to ${toVersion}`);

    try {
        // バージョン別のマイグレーション処理
        if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
            await migrateToV1_1_0();
        }

        if (fromVersion === '1.1.0' && toVersion === '1.2.0') {
            await migrateToV1_2_0();
        }

        // バージョン情報を更新
        updateDbVersion(toVersion);

        console.log(`Database migration completed: ${toVersion}`);
    } catch (error) {
        console.error('Database migration failed:', error);
        throw error;
    }
};

// バージョン1.1.0へのマイグレーション例
const migrateToV1_1_0 = async (): Promise<void> => {
    // 例: 新しいカラムを追加
    // await supabase.rpc('add_column_if_not_exists', {
    //   table_name: 'children',
    //   column_name: 'favorite_color',
    //   column_type: 'TEXT'
    // });

    console.log('Migrated to v1.1.0');
};

// バージョン1.2.0へのマイグレーション例
const migrateToV1_2_0 = async (): Promise<void> => {
    // 例: インデックスを追加
    // await supabase.rpc('create_index_if_not_exists', {
    //   table_name: 'record_events',
    //   index_name: 'idx_record_events_category_timestamp',
    //   columns: ['category', 'timestamp']
    // });

    console.log('Migrated to v1.2.0');
};

// 起動時のバージョンチェック
export const initializeVersionCheck = async (): Promise<void> => {
    const currentDbVersion = getCurrentDbVersion();
    const appVersion = APP_VERSION;

    console.log(`App version: ${appVersion}, DB version: ${currentDbVersion}`);

    // 互換性チェック
    if (!checkVersionCompatibility(currentDbVersion, appVersion)) {
        console.warn('Version compatibility issue detected');

        // 必要に応じてマイグレーション実行
        if (currentDbVersion !== appVersion) {
            await performDatabaseMigration(currentDbVersion, appVersion);
        }
    }
};

// 緊急時のデータバックアップ
export const createEmergencyBackup = async (): Promise<void> => {
    try {
        const userId = localStorage.getItem('anonymous_user_id');
        if (!userId) return;

        // 全データを取得
        const { data: allData, error } = await supabase
            .from('users')
            .select(`
        *,
        children(*),
        record_events(*),
        calendar_events(*),
        growth_records(*)
      `)
            .eq('id', userId);

        if (error) throw error;

        // バックアップファイルとして保存
        const backupData = {
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
            data: allData
        };

        localStorage.setItem('emergency_backup', JSON.stringify(backupData));
        console.log('Emergency backup created');
    } catch (error) {
        console.error('Emergency backup failed:', error);
    }
};

// バックアップからの復元
export const restoreFromBackup = async (): Promise<void> => {
    try {
        const backupData = localStorage.getItem('emergency_backup');
        if (!backupData) {
            throw new Error('No backup found');
        }

        const backup = JSON.parse(backupData);
        console.log(`Restoring from backup: ${backup.version} (${backup.timestamp})`);

        // 復元処理（実装は必要に応じて）
        // await restoreUserData(backup.data);

        console.log('Backup restoration completed');
    } catch (error) {
        console.error('Backup restoration failed:', error);
        throw error;
    }
}; 