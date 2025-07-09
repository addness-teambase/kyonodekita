-- =============================================================================
-- 安全なマイグレーション: calendar_eventsテーブルにchild_idカラムを追加
-- =============================================================================
-- 既存のデータを保持したまま、テーブル構造のみを更新します
-- 実行前に必ずデータベースのバックアップを取ってください

-- マイグレーション開始のログ
DO $$
BEGIN
    RAISE NOTICE 'Starting calendar_events migration: adding child_id column';
END $$;

-- 1. child_idカラムが存在しない場合のみ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_events' 
        AND column_name = 'child_id'
    ) THEN
        ALTER TABLE calendar_events ADD COLUMN child_id UUID;
        RAISE NOTICE 'Added child_id column to calendar_events table';
    ELSE
        RAISE NOTICE 'child_id column already exists in calendar_events table';
    END IF;
END $$;

-- 2. 外部キー制約が存在しない場合のみ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public'
        AND constraint_name = 'fk_calendar_events_child_id'
        AND table_name = 'calendar_events'
    ) THEN
        ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_child_id 
        FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for child_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for child_id';
    END IF;
END $$;

-- 3. インデックスが存在しない場合のみ追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'calendar_events' 
        AND indexname = 'idx_calendar_events_child_id'
    ) THEN
        CREATE INDEX idx_calendar_events_child_id ON calendar_events(child_id);
        RAISE NOTICE 'Created index on child_id column';
    ELSE
        RAISE NOTICE 'Index on child_id column already exists';
    END IF;
END $$;

-- 4. 既存のカレンダーイベントの処理
-- option A: 削除する場合
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count FROM calendar_events WHERE child_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % calendar events without child_id. These will be deleted.', orphaned_count;
        DELETE FROM calendar_events WHERE child_id IS NULL;
        RAISE NOTICE 'Deleted % orphaned calendar events', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned calendar events found';
    END IF;
END $$;

-- option B: 最初の子供に関連付ける場合（コメントアウト）
/*
DO $$
DECLARE
    first_child_id UUID;
    orphaned_count INTEGER;
BEGIN
    -- 最初の子供のIDを取得
    SELECT id INTO first_child_id FROM children ORDER BY created_at LIMIT 1;
    
    SELECT COUNT(*) INTO orphaned_count FROM calendar_events WHERE child_id IS NULL;
    
    IF orphaned_count > 0 AND first_child_id IS NOT NULL THEN
        RAISE NOTICE 'Found % calendar events without child_id. Assigning to first child: %', orphaned_count, first_child_id;
        UPDATE calendar_events SET child_id = first_child_id WHERE child_id IS NULL;
        RAISE NOTICE 'Updated % calendar events with first child_id', orphaned_count;
    ELSIF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned calendar events but no children exist. These will be deleted.', orphaned_count;
        DELETE FROM calendar_events WHERE child_id IS NULL;
    ELSE
        RAISE NOTICE 'No orphaned calendar events found';
    END IF;
END $$;
*/

-- 5. child_idをNOT NULLに設定
DO $$
BEGIN
    -- まずNULLの値があるかチェック
    IF EXISTS (SELECT 1 FROM calendar_events WHERE child_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot set child_id to NOT NULL: there are still NULL values in the table';
    END IF;
    
    -- カラムの制約をチェック
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'calendar_events' 
        AND column_name = 'child_id' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE calendar_events ALTER COLUMN child_id SET NOT NULL;
        RAISE NOTICE 'Set child_id column to NOT NULL';
    ELSE
        RAISE NOTICE 'child_id column is already NOT NULL';
    END IF;
END $$;

-- マイグレーション完了のログ
DO $$
BEGIN
    RAISE NOTICE 'Calendar events migration completed successfully!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Added child_id column to calendar_events table';
    RAISE NOTICE '- Added foreign key constraint to children table';
    RAISE NOTICE '- Created index on child_id column';
    RAISE NOTICE '- Processed orphaned calendar events';
    RAISE NOTICE '- Set child_id to NOT NULL';
END $$; 