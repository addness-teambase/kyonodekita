# 🔧 チャット機能デバッグガイド

## 🚨 チャットができない問題の確認手順

### **1. 管理者側チェック**

#### **Step 1: 管理者ログイン確認**
1. **管理者側** (`http://localhost:5174`) にアクセス
2. **ログイン成功** を確認
3. **ブラウザコンソール** を開く (`F12 → Console`)

#### **Step 2: 園児選択確認**
1. **チャット** タブをクリック
2. **園児一覧** が表示されているかを確認
3. **園児をクリック** してチャットを開く
4. **コンソールログ** でエラーを確認

#### **Step 3: メッセージ送信テスト**
1. **メッセージ入力欄** にテストメッセージを入力
2. **送信ボタン** をクリック
3. **コンソールでエラー確認**：
   - `保護者情報取得エラー`
   - `メッセージ送信エラー`
   - `会話作成エラー`

---

### **2. 利用者側チェック**

#### **Step 1: 利用者ログイン確認**
1. **利用者側** (`http://localhost:5175`) にアクセス
2. **保護者アカウントでログイン** を確認
3. **ブラウザコンソール** を開く

#### **Step 2: 直接チャット開始**
1. **チャット** タブをクリック
2. **園と連絡** タブを選択
3. **チャットを開始** ボタンをクリック
4. **コンソールでエラー確認**：
   - `会話の作成に失敗しました`
   - `facility_children情報の取得エラー`

---

### **3. よくあるエラーと原因**

#### **❌ Error: 保護者情報が見つかりませんでした**
**原因**: `facility_children`テーブルに関連レコードがない
**解決**: 管理者側で園児を再登録する

#### **❌ Error: facility_children情報の取得エラー**
**原因**: データベース権限またはテーブル構造の問題
**解決**: Supabaseでテーブル確認・権限設定

#### **❌ Error: チャットの開始に失敗しました**
**原因**: `direct_chat_conversations`テーブルへの書き込み権限がない
**解決**: Supabaseのテーブル権限確認

#### **❌ Error: メッセージの送信に失敗しました**
**原因**: `direct_chat_messages`テーブルへの書き込み権限がない
**解決**: Supabaseのテーブル権限確認

---

### **4. 緊急修正手順**

もしチャット機能が全く動作しない場合は、以下を確認してください：

#### **Supabaseテーブル権限確認**
1. Supabase Dashboard → Authentication → Policies
2. 以下のテーブルに対して適切な権限があるか確認：
   - `direct_chat_conversations`
   - `direct_chat_messages`
   - `facility_children`

#### **緊急デバッグ追加**
コンソールログを増やして問題を特定するために、以下のコードを追加します：

```typescript
// 管理者側 sendMessage 関数の先頭に追加
console.log('🔧 デバッグ: sendMessage開始', { 
  newMessage: newMessage.trim(), 
  chatChild, 
  userId: user?.id 
});

// 利用者側 handleStartDirectChat 関数の先頭に追加
console.log('🔧 デバッグ: handleStartDirectChat開始', { 
  userId: user?.id, 
  activeChildId 
});
```

---

### **5. データベース確認SQL**

Supabaseで以下のSQLを実行して、データの存在を確認：

```sql
-- 1. ユーザー確認
SELECT id, username, user_type FROM users WHERE user_type IN ('parent', 'admin');

-- 2. 園児と保護者の関連確認
SELECT 
  fc.id,
  c.name as child_name,
  u.username as parent_username,
  f.name as facility_name
FROM facility_children fc
JOIN children c ON c.id = fc.child_id
JOIN users u ON u.id = fc.parent_user_id
JOIN facilities f ON f.id = fc.facility_id
WHERE fc.status = 'active';

-- 3. チャット会話確認
SELECT 
  dcc.id,
  c.name as child_name,
  u.username as parent_username,
  f.name as facility_name
FROM direct_chat_conversations dcc
JOIN children c ON c.id = dcc.child_id
JOIN users u ON u.id = dcc.parent_user_id
JOIN facilities f ON f.id = dcc.facility_id;

-- 4. チャットメッセージ確認
SELECT 
  dcm.id,
  dcm.content,
  dcm.sender_type,
  dcm.created_at
FROM direct_chat_messages dcm
ORDER BY dcm.created_at DESC
LIMIT 10;
```

