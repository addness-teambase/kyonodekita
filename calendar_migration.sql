-- カレンダーイベントテーブルに子供IDを追加するマイグレーション
-- 既存のテーブルにchild_idカラムを追加

-- 1. child_idカラムを追加（一時的にNULLを許可）
ALTER TABLE calendar_events ADD COLUMN child_id UUID;

-- 2. 外部キー制約を追加
ALTER TABLE calendar_events ADD CONSTRAINT fk_calendar_events_child_id 
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- 3. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_calendar_events_child_id ON calendar_events(child_id);

-- 4. 既存のイベントを削除（子供IDがないため）
DELETE FROM calendar_events WHERE child_id IS NULL;

-- 5. child_idをNOT NULLに設定
ALTER TABLE calendar_events ALTER COLUMN child_id SET NOT NULL; 