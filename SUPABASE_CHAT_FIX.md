# 🔧 Supabaseチャット機能権限修正

## 🚨 **緊急修正: チャットが動かない問題**

### **問題**: チャット機能でエラーが発生する
### **原因**: Supabaseテーブル権限（RLS: Row Level Security）の設定不備

---

## ⚡ **即座修正手順（5分）**

### **Step 1: Supabase Dashboard にアクセス**
```bash
https://app.supabase.com/
→ プロジェクト選択
→ 左サイドバー「Authentication」→「Policies」
```

### **Step 2: チャット関連テーブルの権限を設定**

#### **A) `direct_chat_conversations` テーブル**

**新しいポリシーを作成:**
```sql
-- ポリシー名: "chat_conversations_policy"
-- 対象操作: SELECT, INSERT, UPDATE
-- 条件: authenticated

CREATE POLICY "chat_conversations_policy" 
ON "public"."direct_chat_conversations"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

#### **B) `direct_chat_messages` テーブル**

**新しいポリシーを作成:**
```sql
-- ポリシー名: "chat_messages_policy"  
-- 対象操作: SELECT, INSERT, UPDATE
-- 条件: authenticated

CREATE POLICY "chat_messages_policy"
ON "public"."direct_chat_messages"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

#### **C) `facility_children` テーブル**

**新しいポリシーを作成:**
```sql
-- ポリシー名: "facility_children_policy"
-- 対象操作: SELECT, INSERT, UPDATE, DELETE
-- 条件: authenticated

CREATE POLICY "facility_children_policy"
ON "public"."facility_children"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### **Step 3: ワンクリック権限設定（推奨）**

**最も簡単な方法 - 以下のSQLをSupabase SQL Editorで実行:**

```sql
-- =============================================================
-- チャット機能緊急権限修正（認証済みユーザーに全権限付与）
-- =============================================================

-- Step 1: 既存のポリシーを削除（エラーが出ても続行）
DROP POLICY IF EXISTS "chat_conversations_policy" ON direct_chat_conversations;
DROP POLICY IF EXISTS "chat_messages_policy" ON direct_chat_messages;
DROP POLICY IF EXISTS "facility_children_policy" ON facility_children;

-- Step 2: 新しい権限ポリシーを作成
CREATE POLICY "chat_conversations_policy" 
ON "public"."direct_chat_conversations"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "chat_messages_policy"
ON "public"."direct_chat_messages"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "facility_children_policy"
ON "public"."facility_children"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 3: RLS有効化確認
ALTER TABLE "public"."direct_chat_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."direct_chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."facility_children" ENABLE ROW LEVEL SECURITY;

-- Step 4: 確認用クエリ
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('direct_chat_conversations', 'direct_chat_messages', 'facility_children');
```

---

## 🧪 **修正後のテスト手順**

### **1. 管理者側テスト**
1. **管理者でログイン** (`http://localhost:5174`)
2. **チャット** → **園児選択** → **メッセージ送信**
3. **ブラウザコンソール確認** - エラーがないことを確認

### **2. 利用者側テスト**
1. **保護者でログイン** (`http://localhost:5175`)
2. **チャット** → **園と連絡** → **チャットを開始**
3. **メッセージ送信テスト**

---

## 🔍 **デバッグ情報の確認方法**

### **ブラウザコンソールでの確認**

修正後、以下のログが表示されるはずです：

#### **管理者側の正常ログ:**
```
🔧 管理者チャット送信開始: { message: "テスト", chatChild: "xxx", adminId: "yyy" }
🔧 facility_children確認結果: { facilityChild: {...}, error: null }
```

#### **利用者側の正常ログ:**
```
🔧 利用者チャット開始: { userId: "xxx", username: "parent1", activeChildId: "yyy" }  
🔧 会話作成結果: { conversation: {...}, error: null }
```

### **エラーが続く場合**

以下のSQLでデータ確認：

```sql
-- 1. facility_children テーブル確認
SELECT 
  fc.id,
  c.name as child_name,
  u.username as parent_username,
  fc.status
FROM facility_children fc
JOIN children c ON c.id = fc.child_id  
JOIN users u ON u.id = fc.parent_user_id
WHERE fc.status = 'active';

-- 2. 権限設定確認
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('direct_chat_conversations', 'direct_chat_messages', 'facility_children');
```

---

## 🎯 **期待される結果**

修正後、以下が可能になります：

- ✅ **管理者**: 園児選択 → チャット開始 → メッセージ送信
- ✅ **保護者**: チャット開始 → メッセージ送受信
- ✅ **双方向通信**: リアルタイムでのメッセージ交換

---

**🚀 上記SQLを実行後、アプリを再読み込みしてチャット機能をテストしてください！**

