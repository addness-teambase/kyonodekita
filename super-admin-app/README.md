# きょうのできた - スーパー管理者アプリ

## 概要

「きょうのできた」のスーパー管理者用ダッシュボードです。
全施設の管理、統計情報の閲覧、施設の削除などができます。

## 機能

- ✅ 全施設一覧の表示
- ✅ 各施設のユーザー数表示
- ✅ 施設の作成日・最終更新日表示
- ✅ 施設の削除機能
- ✅ 統計サマリー表示（総施設数、総ユーザー数、今月の新規施設数）
- ✅ スーパー管理者専用ログイン

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、Supabaseの設定を記入してください：

```bash
cp .env.local.example .env.local
```

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. データベースの設定

`users`テーブルに`super_admin`権限を追加する必要があります：

```sql
-- user_typeに'super_admin'を追加
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('parent', 'admin', 'facility_admin', 'facility_staff', 'super_admin'));

-- スーパー管理者アカウントの作成例
INSERT INTO users (username, password, user_type, display_name)
VALUES ('superadmin', 'hashed_password_here', 'super_admin', 'スーパー管理者');
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリは http://localhost:5174 で起動します。

## 本番ビルド

```bash
npm run build
npm run preview
```

## セキュリティ

- スーパー管理者専用のログインシステム
- `user_type = 'super_admin'`のユーザーのみアクセス可能
- 不正アクセスは記録される旨を明示

## 開発情報

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Lucide React (アイコン)
- date-fns (日付フォーマット)






