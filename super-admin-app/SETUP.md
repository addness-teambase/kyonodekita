# スーパー管理者アプリ - セットアップガイド

## 📋 概要

全施設の管理、統計情報の閲覧、施設の削除などができるスーパー管理者専用ダッシュボードです。

## 🎯 機能

✅ **施設管理**
- 全施設一覧の表示
- 各施設のユーザー数表示
- 施設の作成日・最終更新日表示
- 施設の削除機能（確認プロンプト付き）

✅ **統計情報**
- 総施設数
- 総ユーザー数
- 有効施設数
- 今月の新規施設数

✅ **セキュリティ**
- スーパー管理者専用ログイン
- `user_type = 'super_admin'`のユーザーのみアクセス可能

## 🚀 セットアップ手順

### Step 1: データベースの更新

Supabaseの管理画面にログインして、以下のSQLを実行してください：

1. https://app.supabase.com/ にアクセス
2. プロジェクトを選択
3. 左サイドバー「SQL Editor」をクリック
4. 「New Query」をクリック
5. 以下のSQLをコピー&ペーストして「Run」をクリック

```sql
-- スーパー管理者権限の追加
-- 既存のCHECK制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- 新しいCHECK制約を追加（super_adminを含む）
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type IN ('parent', 'admin', 'facility_admin', 'facility_staff', 'super_admin'));

-- スーパー管理者アカウントの作成
-- 既存のsuperadminアカウントがあれば削除
DELETE FROM users WHERE username = 'superadmin';

-- スーパー管理者アカウントを作成
-- ユーザー名: superadmin
-- パスワード: admin123 (実際の環境では強力なパスワードに変更してください)
INSERT INTO users (
  username, 
  password, 
  plain_password,
  user_type, 
  display_name,
  email
) VALUES (
  'superadmin',
  '87e1e87b', -- admin123 のハッシュ値
  'admin123', -- 平文パスワード（確認用）※本番環境では削除推奨
  'super_admin',
  'スーパー管理者',
  'superadmin@example.com'
);

-- 確認
SELECT 
  id,
  username,
  user_type,
  display_name,
  email,
  created_at
FROM users 
WHERE user_type = 'super_admin';
```

### Step 2: 環境変数の確認

`.env.local` ファイルが存在し、以下の内容が設定されているか確認：

```env
VITE_SUPABASE_URL=https://ognianlobgsqcjpacgqo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

※ 既に parent-app からコピー済みです

### Step 3: 依存関係のインストール（完了済み）

```bash
npm install
```

### Step 4: 開発サーバーの起動

```bash
npm run dev
```

アプリは http://localhost:5174 で起動します。

### Step 5: ログイン

- **ユーザー名**: `superadmin`
- **パスワード**: `admin123`

## 🔐 セキュリティ注意事項

### 本番環境での推奨事項

1. **強力なパスワードに変更**
   ```sql
   UPDATE users 
   SET password = 'your_hashed_password', 
       plain_password = NULL
   WHERE username = 'superadmin';
   ```

2. **平文パスワードの削除**
   ```sql
   UPDATE users SET plain_password = NULL WHERE user_type = 'super_admin';
   ```

3. **IPアドレス制限の設定**
   - Supabaseのセキュリティ設定で特定のIPアドレスのみアクセスを許可

4. **アクセスログの監視**
   - 不正アクセスがないか定期的にチェック

## 📊 使い方

### 施設一覧の確認

ダッシュボードには全施設が表示されます：
- 施設名と施設コード
- 管理者名
- ユーザー数
- ステータス（有効/無効）
- 作成日
- 最終更新日

### 施設の削除

1. 削除したい施設の「削除」ボタンをクリック
2. ボタンが赤く変わり「本当に削除？」と表示されます
3. もう一度クリックすると削除が実行されます
4. 3秒以内にクリックしないとキャンセルされます

⚠️ **注意**: 施設を削除すると、関連するデータも削除される可能性があります。

### 統計情報

ダッシュボード上部に以下の統計が表示されます：
- 📊 総施設数
- 👥 総ユーザー数
- ✅ 有効施設数
- 📈 今月の新規施設数

### データの更新

右上の更新ボタン（🔄）をクリックすると、最新のデータを取得します。

## 🛠️ トラブルシューティング

### ログインできない

1. データベースで `super_admin` 権限が追加されているか確認
2. パスワードが正しいか確認（デフォルト: `admin123`）
3. ブラウザのコンソールでエラーを確認

### 施設が表示されない

1. Supabaseの接続が正しいか確認
2. `facilities` テーブルにデータが存在するか確認
3. ネットワーク接続を確認

### 削除できない

1. スーパー管理者権限があるか確認
2. ブラウザのコンソールでエラーを確認
3. Supabaseの権限設定を確認

## 📁 ファイル構成

```
super-admin-app/
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx      # ログイン画面
│   │   └── Dashboard.tsx      # ダッシュボード
│   ├── context/
│   │   └── AuthContext.tsx    # 認証コンテキスト
│   ├── lib/
│   │   └── supabase.ts        # Supabase設定
│   ├── App.tsx                # メインアプリ
│   ├── main.tsx              # エントリーポイント
│   └── index.css             # スタイル
├── package.json
├── vite.config.ts
└── .env.local                # 環境変数（コピー済み）
```

## 🎨 技術スタック

- **React 18** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング
- **Supabase** - データベース
- **Lucide React** - アイコン
- **date-fns** - 日付フォーマット

## 📝 今後の拡張予定

- [ ] 施設の詳細情報表示
- [ ] 施設の編集機能
- [ ] ユーザー管理機能
- [ ] 課金管理機能
- [ ] アクセスログビューアー
- [ ] レポート・分析機能
- [ ] メール通知機能

## 🤝 サポート

問題が発生した場合は、以下を確認してください：
1. このドキュメントのトラブルシューティングセクション
2. ブラウザのコンソールログ
3. Supabaseのログ

---

**作成日**: 2025年10月5日
**バージョン**: 1.0.0






