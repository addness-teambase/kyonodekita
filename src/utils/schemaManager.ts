import { supabase } from '../lib/supabase';

// スキーマバージョン管理
export const SCHEMA_VERSIONS = {
    '1.0.0': 'Initial schema',
    '1.1.0': 'Added favorite_color to children',
    '1.2.0': 'Added notification settings',
    '1.3.0': 'Added sharing features',
    '1.4.0': 'Added analytics tables',
    '2.0.0': 'Major restructure'
} as const;

type SchemaVersion = keyof typeof SCHEMA_VERSIONS;

// スキーマ変更の種類
export type SchemaChangeType =
    | 'ADD_COLUMN'      // カラム追加（安全）
    | 'ADD_TABLE'       // テーブル追加（安全）
    | 'ADD_INDEX'       // インデックス追加（安全）
    | 'MODIFY_COLUMN'   // カラム変更（注意）
    | 'DROP_COLUMN'     // カラム削除（危険）
    | 'RENAME_TABLE'    // テーブル名変更（危険）
    | 'RESTRUCTURE';    // 構造変更（危険）

// スキーマ変更の定義
interface SchemaChange {
    version: SchemaVersion;
    type: SchemaChangeType;
    description: string;
    sql: string;
    rollback?: string;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresBackup: boolean;
}

// 予定されているスキーマ変更
export const PENDING_SCHEMA_CHANGES: SchemaChange[] = [
    {
        version: '1.1.0',
        type: 'ADD_COLUMN',
        description: '子供の好きな色を追加',
        sql: `ALTER TABLE children ADD COLUMN IF NOT EXISTS favorite_color TEXT;`,
        rollback: `ALTER TABLE children DROP COLUMN IF EXISTS favorite_color;`,
        risk: 'LOW',
        requiresBackup: false
    },
    {
        version: '1.2.0',
        type: 'ADD_TABLE',
        description: '通知設定テーブルを追加',
        sql: `
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        daily_reminder BOOLEAN DEFAULT true,
        weekly_summary BOOLEAN DEFAULT true,
        birthday_alerts BOOLEAN DEFAULT true,
        reminder_time TIME DEFAULT '20:00:00'
      );
      
      ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their notification settings" 
      ON notification_settings FOR ALL 
      USING (auth.uid() = user_id);
    `,
        rollback: `DROP TABLE IF EXISTS notification_settings;`,
        risk: 'LOW',
        requiresBackup: false
    },
    {
        version: '1.3.0',
        type: 'ADD_TABLE',
        description: '共有機能のテーブルを追加',
        sql: `
      CREATE TABLE IF NOT EXISTS shared_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        record_id UUID NOT NULL,
        record_type TEXT NOT NULL CHECK (record_type IN ('record_event', 'growth_record')),
        shared_with_email TEXT,
        shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_public BOOLEAN DEFAULT false,
        share_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()
      );
      
      ALTER TABLE shared_records ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their shared records" 
      ON shared_records FOR ALL 
      USING (auth.uid() = user_id);
    `,
        rollback: `DROP TABLE IF EXISTS shared_records;`,
        risk: 'LOW',
        requiresBackup: false
    },
    {
        version: '1.4.0',
        type: 'ADD_TABLE',
        description: '統計・分析用テーブルを追加',
        sql: `
      CREATE TABLE IF NOT EXISTS analytics_summary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        total_records INTEGER DEFAULT 0,
        achievement_count INTEGER DEFAULT 0,
        happy_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        trouble_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, child_id, date)
      );
      
      ALTER TABLE analytics_summary ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view their analytics" 
      ON analytics_summary FOR ALL 
      USING (auth.uid() = user_id);
      
      CREATE INDEX idx_analytics_summary_date ON analytics_summary(date);
      CREATE INDEX idx_analytics_summary_child_date ON analytics_summary(child_id, date);
    `,
        rollback: `DROP TABLE IF EXISTS analytics_summary;`,
        risk: 'LOW',
        requiresBackup: false
    }
];

// 現在のスキーマバージョンを取得
export const getCurrentSchemaVersion = (): SchemaVersion => {
    return localStorage.getItem('schema_version') as SchemaVersion || '1.0.0';
};

// スキーマバージョンを更新
export const updateSchemaVersion = (version: SchemaVersion): void => {
    localStorage.setItem('schema_version', version);
};

// スキーマ変更の実行
export const executeSchemaChange = async (change: SchemaChange): Promise<void> => {
    console.log(`Executing schema change: ${change.description}`);

    try {
        // 高リスクの変更の場合はバックアップを作成
        if (change.requiresBackup) {
            await createSchemaBackup();
        }

        // スキーマ変更を実行
        const { error } = await supabase.rpc('execute_sql', {
            query: change.sql
        });

        if (error) {
            throw error;
        }

        // バージョンを更新
        updateSchemaVersion(change.version);

        console.log(`Schema change completed: ${change.version}`);
    } catch (error) {
        console.error('Schema change failed:', error);

        // ロールバックが可能な場合は実行
        if (change.rollback) {
            console.log('Attempting rollback...');
            await supabase.rpc('execute_sql', {
                query: change.rollback
            });
        }

        throw error;
    }
};

// 待機中のスキーマ変更を適用
export const applyPendingSchemaChanges = async (): Promise<void> => {
    const currentVersion = getCurrentSchemaVersion();

    // 現在のバージョンより新しい変更を取得
    const pendingChanges = PENDING_SCHEMA_CHANGES.filter(change =>
        compareVersions(change.version, currentVersion) > 0
    );

    if (pendingChanges.length === 0) {
        console.log('No pending schema changes');
        return;
    }

    console.log(`Found ${pendingChanges.length} pending schema changes`);

    // バージョン順にソート
    pendingChanges.sort((a, b) => compareVersions(a.version, b.version));

    // 順番に実行
    for (const change of pendingChanges) {
        await executeSchemaChange(change);
    }
};

// バージョン比較
const compareVersions = (v1: string, v2: string): number => {
    const [major1, minor1, patch1] = v1.split('.').map(Number);
    const [major2, minor2, patch2] = v2.split('.').map(Number);

    if (major1 !== major2) return major1 - major2;
    if (minor1 !== minor2) return minor1 - minor2;
    return patch1 - patch2;
};

// スキーマバックアップの作成
const createSchemaBackup = async (): Promise<void> => {
    try {
        // 現在のスキーマ情報を取得
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('*')
            .eq('table_schema', 'public');

        if (error) throw error;

        // バックアップ情報を保存
        const backupInfo = {
            timestamp: new Date().toISOString(),
            schema_version: getCurrentSchemaVersion(),
            tables: tables
        };

        localStorage.setItem('schema_backup', JSON.stringify(backupInfo));
        console.log('Schema backup created');
    } catch (error) {
        console.error('Schema backup failed:', error);
    }
};

// 安全なスキーマ変更チェック
export const validateSchemaChange = (change: SchemaChange): boolean => {
    // 危険な操作をチェック
    const dangerousPatterns = [
        'DROP TABLE',
        'DROP COLUMN',
        'ALTER COLUMN.*DROP',
        'TRUNCATE',
        'DELETE FROM'
    ];

    const isDangerous = dangerousPatterns.some(pattern =>
        new RegExp(pattern, 'i').test(change.sql)
    );

    if (isDangerous && change.risk !== 'HIGH') {
        console.warn(`Potentially dangerous schema change detected: ${change.description}`);
        return false;
    }

    return true;
};

// 開発モードでのスキーマリセット
export const resetSchemaForDevelopment = async (): Promise<void> => {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Schema reset is only available in development mode');
    }

    console.log('Resetting schema for development...');

    // 全テーブルを削除（開発時のみ）
    const resetSQL = `
    DROP TABLE IF EXISTS analytics_summary CASCADE;
    DROP TABLE IF EXISTS shared_records CASCADE;
    DROP TABLE IF EXISTS notification_settings CASCADE;
    DROP TABLE IF EXISTS growth_records CASCADE;
    DROP TABLE IF EXISTS calendar_events CASCADE;
    DROP TABLE IF EXISTS record_events CASCADE;
    DROP TABLE IF EXISTS children CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `;

    await supabase.rpc('execute_sql', { query: resetSQL });

    // 初期スキーマを再作成
    const { error } = await supabase.rpc('execute_sql', {
        query: await fetch('/supabase-schema.sql').then(r => r.text())
    });

    if (error) throw error;

    // バージョンをリセット
    updateSchemaVersion('1.0.0');

    console.log('Schema reset completed');
};

// スキーマ変更の予約
export const scheduleSchemaChange = (change: SchemaChange): void => {
    const scheduled = JSON.parse(localStorage.getItem('scheduled_changes') || '[]');
    scheduled.push({
        ...change,
        scheduled_at: new Date().toISOString()
    });
    localStorage.setItem('scheduled_changes', JSON.stringify(scheduled));
};

// 予約されたスキーマ変更の確認
export const getScheduledChanges = (): SchemaChange[] => {
    return JSON.parse(localStorage.getItem('scheduled_changes') || '[]');
}; 