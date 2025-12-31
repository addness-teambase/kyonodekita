# セットアップガイド

## 1. データベースセットアップ

まず、Supabaseでテーブルを作成します。

### SQL実行

`/shared/expert_consultation_schema.sql` の内容をSupabase SQL Editorで実行してください。

これにより以下のテーブルが作成されます：
- `experts` - 専門家情報
- `expert_consultations` - 相談予約情報

### 管理者アカウント作成

専門家管理アプリにログインするためのアカウントを作成します。

```sql
-- 管理者ユーザーを作成（パスワードは「kyou-no-dekita-salt」でハッシュ化）
INSERT INTO users (username, password, user_type, display_name)
VALUES (
  'expert-admin',  -- ユーザー名
  'S3l vLW5rbmEta3lvdS1uby1kZWtpdGEtc2FsdA==',  -- password: "password123"
  'facility_admin',
  '専門家管理者'
);
```

または、カスタムパスワードを使用する場合：

```javascript
// ブラウザのコンソールで実行
const password = "your_password"; // 任意のパスワード
const hashedPassword = btoa(password + 'kyou-no-dekita-salt');
console.log(hashedPassword);
// この結果をSQLのpasswordフィールドに使用
```

## 2. アプリケーション起動

```bash
cd expert-admin-app
npm install
npm run dev
```

アプリは http://localhost:5173 で起動します。

## 3. ログイン

- ユーザー名: `expert-admin`
- パスワード: `password123`（デフォルト）

## 4. 専門家を追加

1. 「専門家管理」タブを開く
2. 「専門家を追加」ボタンをクリック
3. 必要事項を入力：
   - 氏名
   - 自己紹介
   - 相談内容の説明
   - 相談料金（デフォルト: 3000円）
   - TimeRex URL
   - 表示順序
4. 「追加する」ボタンをクリック

## 5. 親アプリで確認

親アプリを開いて、「相談」タブを確認してください。
追加した専門家が即座に表示されます。

## トラブルシューティング

### テーブルが見つからない場合

Supabase SQL Editorで`expert_consultation_schema.sql`を実行してください。

### ログインできない場合

1. usersテーブルにレコードが存在するか確認
2. パスワードのハッシュが正しいか確認
3. user_typeが`facility_admin`になっているか確認

### 専門家が親アプリに表示されない場合

1. expertsテーブルに`is_active = true`で登録されているか確認
2. 親アプリをリロード
3. ブラウザのコンソールでエラーを確認





