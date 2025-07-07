# Supabaseセットアップガイド

このガイドでは、「きょうのできた」アプリのデータを永続化するためのSupabaseの設定方法を説明します。

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン
4. 「New Project」をクリック
5. 以下の情報を入力：
   - **Name**: kyou-no-dekita（または任意の名前）
   - **Database Password**: 強力なパスワードを設定
   - **Region**: Northeast Asia (Tokyo)を選択
6. 「Create new project」をクリック

## 2. データベーススキーマの設定

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 「New Query」をクリック
3. `supabase-schema.sql`の内容をコピーして貼り付け
4. 「Run」をクリックしてスキーマを作成

## 3. 環境変数の設定

1. Supabaseダッシュボードで「Settings」 → 「API」を開く
2. 以下の情報をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. プロジェクトルートに`.env`ファイルを作成：
```bash
# Supabaseの設定
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key-here

# Google AI API Key (既存)
VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## 4. 依存関係のインストール

```bash
npm install
```

## 5. 動作確認

1. アプリケーションを起動：
```bash
npm run dev
```

2. ブラウザで確認：
   - 既存データがある場合、自動的にSupabaseに移行されます
   - 新しいデータがSupabaseに保存されます
   - オフライン時もデータが保持されます

## 6. Row Level Security (RLS) の確認

データベースのセキュリティを確認：

1. Supabaseダッシュボードで「Authentication」 → 「Policies」を開く
2. 各テーブルでポリシーが設定されていることを確認
3. 必要に応じて追加のポリシーを設定

## 7. バックアップの設定

1. Supabaseダッシュボードで「Settings」 → 「Database」を開く
2. 「Point-in-time recovery」を有効にする（Pro版以上）
3. 定期的なバックアップを設定

## 8. トラブルシューティング

### よくある問題と解決方法

**問題1**: データが移行されない
- 解決方法: ブラウザの開発者ツールでコンソールエラーを確認
- 環境変数が正しく設定されているか確認

**問題2**: オンライン・オフライン同期が動作しない
- 解決方法: ネットワーク接続を確認
- `localStorage`に`migration_completed`が設定されているか確認

**問題3**: 認証エラー
- 解決方法: Supabaseの匿名アクセスが有効になっているか確認
- RLSポリシーが正しく設定されているか確認

## 9. 本番環境への移行

1. Vercelなどのデプロイプラットフォームで環境変数を設定
2. Supabaseの本番環境URLを使用
3. HTTPS接続を確認
4. パフォーマンスモニタリングを設定

## 10. メンテナンス

- 定期的なデータベースの最適化
- 不要なデータの削除
- セキュリティアップデートの確認
- バックアップの動作確認

---

## データ移行について

### 自動移行の仕組み

1. **初回起動時**: 既存のlocalStorageデータを自動的にSupabaseに移行
2. **移行完了後**: 新しいデータは直接Supabaseに保存
3. **オフライン時**: localStorageに一時保存し、オンライン時に同期

### 手動でのデータ確認

Supabaseダッシュボードの「Table editor」で以下のテーブルを確認できます：

- `users`: ユーザー情報
- `children`: 子供の情報
- `record_events`: 記録データ
- `calendar_events`: カレンダーイベント
- `growth_records`: 成長記録

### データの完全性の保証

- データの重複を防ぐため、IDベースでの管理
- トランザクション処理による整合性の保証
- 定期的なバックアップによるデータ保護

これで、アプリケーションのアップデートでもデータが失われることなく、永続的に保存されます。 