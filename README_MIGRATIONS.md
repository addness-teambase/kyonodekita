# マイグレーション管理ガイド

## 📚 マイグレーションファイル命名規則

```
migration_YYYY-MM-DD_機能名.sql
```

例：
- `migration_2024-01-15_calendar_child_id.sql`
- `migration_2024-02-01_add_user_avatars.sql`
- `migration_2024-03-10_chat_attachments.sql`

## 🛡️ 安全なマイグレーション原則

### ✅ やるべきこと
1. **必ずバックアップを取る**
2. **冪等性を確保**（何度実行しても同じ結果）
3. **詳細なログ出力**
4. **段階的実行**（一度に大量変更しない）
5. **ロールバック計画**

### ❌ やってはいけないこと
1. **DROP TABLE**（本番環境では禁止）
2. **データ型の互換性のない変更**
3. **外部キー制約の突然削除**
4. **バックアップなしの実行**

## 📋 マイグレーションテンプレート

```sql
-- =============================================================================
-- マイグレーション: [機能名]
-- 作成日: YYYY-MM-DD
-- 説明: [変更内容の説明]
-- =============================================================================

-- マイグレーション開始ログ
DO $$
BEGIN
    RAISE NOTICE 'Starting [機能名] migration';
END $$;

-- 1. カラム追加（存在チェック付き）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'テーブル名' 
        AND column_name = 'カラム名'
    ) THEN
        ALTER TABLE テーブル名 ADD COLUMN カラム名 型;
        RAISE NOTICE 'Added カラム名 column';
    ELSE
        RAISE NOTICE 'カラム名 column already exists';
    END IF;
END $$;

-- 2. インデックス追加（存在チェック付き）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'テーブル名' 
        AND indexname = 'インデックス名'
    ) THEN
        CREATE INDEX インデックス名 ON テーブル名(カラム名);
        RAISE NOTICE 'Created index';
    ELSE
        RAISE NOTICE 'Index already exists';
    END IF;
END $$;

-- マイグレーション完了ログ
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
END $$;
```

## 🚀 実行手順

### 開発環境
```bash
# 新規作成（データリセット）
psql -f database.sql

# マイグレーション（データ保持）
psql -f migration_YYYY-MM-DD_機能名.sql
```

### 本番環境（Supabase）
1. **SQL Editor**でマイグレーションファイルを実行
2. **ログを確認**
3. **アプリケーションで動作確認**
4. **問題があればロールバック**

## 📊 マイグレーション履歴管理

今後、マイグレーション履歴テーブルを作成することを推奨：

```sql
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE
);
``` 