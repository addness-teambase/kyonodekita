# 🚀 Supabaseセットアップ手順

## 1. Supabaseでデータベース作成

### Step 1: SQLエディターを開く
1. https://app.supabase.com/ にアクセス
2. プロジェクトを選択
3. 左サイドバー「SQL Editor」をクリック
4. 「New Query」をクリック

### Step 2: master_database.sqlを実行
1. `shared/master_database.sql` の内容を全てコピー
2. SQL Editorに貼り付け
3. 「Run」ボタンをクリック

### Step 3: 実行結果を確認
以下のメッセージが表示されれば成功：
```
✅ きょうのできた - 統一マスターデータベース構築完了！
📊 作成されたテーブル数: 19個
🔗 親アプリ ⟷ 管理アプリの完全統合
🏢 マルチテナント対応完了
👥 統一認証システム準備完了
🚀 本番環境で使用可能です！
```

### Step 4: テーブルの確認
左サイドバー「Table Editor」で以下のテーブルが作成されているか確認：
- ✅ users
- ✅ facilities  
- ✅ children
- ✅ records
- ✅ calendar_events
- ✅ growth_records
- ✅ daily_records
- ✅ attendance_schedules
- ✅ chat_sessions
- ✅ chat_messages
- など...

## 2. 環境変数の設定

### parent-app/.env
```env
VITE_SUPABASE_URL=あなたのSupabaseURL
VITE_SUPABASE_ANON_KEY=あなたのSupabaseキー
VITE_GEMINI_API_KEY=あなたのGeminiAPIキー
```

### admin-app/.env  
```env
VITE_SUPABASE_URL=あなたのSupabaseURL
VITE_SUPABASE_ANON_KEY=あなたのSupabaseキー
```

## 3. テストログイン

### 親アプリ
- ユーザー名: `demo_parent`
- パスワード: `demo123`

### 管理アプリ
- 事業所名: `きょうのできた保育園`
- 管理者名: `demo_admin`  
- パスワード: `admin123`

## 4. トラブルシューティング

### テーブル作成に失敗した場合
1. エラーメッセージを確認
2. 既存のテーブルがある場合は、SQLの最初の`DROP TABLE`部分が実行されているか確認
3. 権限エラーの場合は、Supabaseプロジェクトの所有者権限があるか確認

### 環境変数が見つからない場合
1. `.env`ファイルが正しい場所にあるか確認
2. ファイル名が`.env`（`.env.example`ではない）か確認
3. アプリを再起動（`npm run dev`）

### ログインできない場合
1. Supabaseでテーブルが作成されているか確認
2. `users`テーブルにサンプルデータが挿入されているか確認
3. ブラウザの開発者ツールでエラーメッセージを確認
