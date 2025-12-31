# 先生と管理者アカウントの紐付けガイド

## 📋 概要

専門家相談機能では、**先生（experts）と管理者アカウント（users）を紐付ける**ことで、管理者が自分の予約を確認・管理できるようになります。

---

## 🔗 紐付けの仕組み

### データベース構造

```
users (管理者アカウント)
  ↓ (admin_user_idで参照)
experts (先生)
  ↓ (expert_idで参照)
expert_consultations (予約)
```

### 紐付けの流れ

1. **管理者アカウントを作成**（`users`テーブル）
   - `user_type` = `'admin'` または `'facility_admin'`
   
2. **先生情報を登録**（`experts`テーブル）
   - `admin_user_id`に管理者の`user_id`を設定

3. **予約が作成される**（`expert_consultations`テーブル）
   - `expert_id`で先生を参照
   - 管理者は`expert_id`経由で自分の予約を確認

---

## 💻 実装方法

### 方法1: SQLで直接紐付け

```sql
-- 1. 管理者アカウントのIDを確認
SELECT id, username, user_type 
FROM users 
WHERE user_type IN ('admin', 'facility_admin');

-- 2. 先生と管理者を紐付け
UPDATE experts 
SET admin_user_id = '管理者のユーザーID'  -- 上記で取得したID
WHERE name = '田中 花子';
```

### 方法2: 管理画面で紐付け（将来的に実装）

管理者アプリの設定画面で：
1. 先生一覧を表示
2. 各先生に「管理者を紐付け」ボタンを表示
3. 管理者を選択して紐付け

---

## 🔍 予約の取得方法

### 管理者が自分の予約を取得するクエリ

```sql
-- 管理者が自分の予約を取得
SELECT 
  ec.*,
  e.name AS expert_name,
  u.username AS parent_name
FROM expert_consultations ec
INNER JOIN experts e ON ec.expert_id = e.id
INNER JOIN users u ON ec.user_id = u.id
WHERE e.admin_user_id = '現在の管理者のユーザーID'  -- auth.uid()を使用
ORDER BY ec.consultation_date DESC;
```

### Supabaseでの実装例（React）

```typescript
// 管理者アプリで予約を取得
const loadMyConsultations = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('expert_consultations')
    .select(`
      *,
      expert:experts!expert_id (
        name,
        profile_image_url
      ),
      parent:users!user_id (
        username,
        display_name
      )
    `)
    .eq('experts.admin_user_id', user.id)  // RLSポリシーで自動的にフィルタリング
    .order('consultation_date', { ascending: false });

  if (error) {
    console.error('予約取得エラー:', error);
    return;
  }

  return data;
};
```

---

## 🔐 RLS（Row Level Security）ポリシー

既に要件定義書に記載されていますが、管理者が自分の予約のみ閲覧できるようにするポリシー：

```sql
-- 管理者（先生）は自分の予約を閲覧可能（expert_idとadmin_user_idで紐付け）
CREATE POLICY "管理者は自分の予約を閲覧可能"
  ON expert_consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experts
      WHERE experts.id = expert_consultations.expert_id
      AND experts.admin_user_id = auth.uid()
    )
  );
```

---

## 📝 ダミーデータでの紐付け例

`expert_consultation_dummy_data.sql`を実行した後：

```sql
-- 管理者アカウントを確認
SELECT id, username FROM users WHERE user_type = 'admin' LIMIT 1;

-- 例: 管理者IDが '123e4567-e89b-12d3-a456-426614174000' の場合
UPDATE experts 
SET admin_user_id = '123e4567-e89b-12d3-a456-426614174000'
WHERE name = '田中 花子';

-- 全先生に同じ管理者を紐付ける場合
UPDATE experts 
SET admin_user_id = '123e4567-e89b-12d3-a456-426614174000'
WHERE admin_user_id IS NULL;
```

---

## ✅ 確認方法

### 紐付けが正しく行われているか確認

```sql
-- 先生と管理者の紐付けを確認
SELECT 
  e.id AS expert_id,
  e.name AS expert_name,
  u.id AS admin_user_id,
  u.username AS admin_username
FROM experts e
LEFT JOIN users u ON e.admin_user_id = u.id
ORDER BY e.display_order;
```

### 管理者が自分の予約を確認できるかテスト

```sql
-- テスト用: 管理者IDを設定して予約を取得
SELECT 
  ec.*,
  e.name AS expert_name
FROM expert_consultations ec
INNER JOIN experts e ON ec.expert_id = e.id
WHERE e.admin_user_id = '管理者のユーザーID';
```

---

## 🎯 次のステップ

1. ✅ ダミーデータの作成（`expert_consultation_dummy_data.sql`）
2. ✅ 管理者アカウントの確認
3. ✅ 先生と管理者の紐付け
4. ⏳ 管理者アプリに予約管理画面を実装
5. ⏳ RLSポリシーのテスト

---

## 📌 注意事項

- **管理者アカウントの作成**: 管理者として機能するには、`users`テーブルの`user_type`が`'admin'`または`'facility_admin'`である必要があります
- **紐付けの一意性**: 1人の先生に対して1人の管理者を紐付ける設計です（必要に応じて複数管理者対応も可能）
- **セキュリティ**: RLSポリシーが正しく設定されていることを確認してください





