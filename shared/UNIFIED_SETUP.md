# 🚀 統合データベースセットアップ（完全版）

## ⚡ ワンファイル統合によるメリット
- 🎯 **一度の実行ですべて完了**
- 📦 **管理しやすい単一ファイル**
- 🔄 **マイグレーション不要**
- 🛡️ **安全な冪等実行**

## 📋 統合内容

### ✅ 統合された機能
- **親アプリ**のすべてのテーブル・機能
- **管理アプリ**のすべてのテーブル・機能  
- **園児情報削除機能**
- **設定画面での園情報編集機能**
- **チャットシステム**（親⟷管理者）
- **マルチテナント対応**
- **完全統合認証**

### 🗃️ 作成されるテーブル（19個）
```
1. users                      - 親・管理者統一認証
2. facilities                 - 園・事業所情報
3. facility_users             - 事業所職員
4. facility_memberships       - 所属関係
5. children                   - 子供基本情報
6. child_facility_relations   - 子供と園の関係
7. facility_children          - 園ごとの詳細情報
8. attendance_schedules       - 出席・活動記録
9. records                    - 親の「できた」記録
10. calendar_events           - カレンダー・予定
11. growth_records            - 成長記録（写真付き）
12. daily_records             - 日記
13. chat_sessions             - AI チャット
14. chat_messages             - AI チャット履歴
15. direct_chat_conversations - 親⟷先生チャット
16. direct_chat_messages      - 直接チャット履歴
17. invitation_links          - 招待システム
18. ai_usage_logs             - AI 使用量追跡
19. data_retention_policies   - データ保持ポリシー
```

## 🚀 実行手順（5分で完了）

### Step 1: Supabase SQL Editor にアクセス
```bash
https://app.supabase.com/
→ プロジェクト選択
→ 左サイドバー「SQL Editor」
→ 「New Query」
```

### Step 2: 統合SQLファイルを実行
```bash
# ファイルの内容をコピー
cat shared/master_database.sql

# SQL Editor に貼り付けて「Run」クリック
```

### Step 3: 成功確認
以下のメッセージが表示されれば完了：
```
✅ きょうのできた - 統一マスターデータベース構築完了！
📊 作成されたテーブル数: 19個
🔗 親アプリ ⟷ 管理アプリの完全統合
🏢 マルチテナント対応完了
👥 統一認証システム準備完了
🚀 本番環境で使用可能です！
```

## 🔧 環境変数設定

### parent-app/.env.local
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GEMINI_API_KEY=your_gemini_key
```

### admin-app/.env.local  
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 🧪 テストログイン

### 親アプリ（localhost:5173）
```
ユーザー名: demo_parent
パスワード: demo123
```

### 管理アプリ（localhost:5174）
```
ユーザー名: demo_admin
パスワード: admin123
```

## ✨ 新機能テスト

### 1. 園情報設定機能
1. 管理アプリで「設定」メニューをクリック
2. 「編集」ボタンで園名・管理者名・住所等を入力
3. 「保存する」で更新完了

### 2. 園児削除機能  
1. 管理アプリで「園児管理」メニュー
2. 園児をクリック → 詳細展開
3. 赤い「削除」ボタンで安全削除

### 3. 統合認証テスト
1. 管理アプリで園児を追加（保護者アカウントも自動作成）
2. 親アプリで提供された認証情報でログイン
3. データが双方向で同期されることを確認

## 🔧 ヘルパースクリプト

### 自動セットアップスクリプト実行
```bash
cd shared
node execute_sql.js
```

これで接続確認と手順案内が表示されます。

## 🛡️ 安全機能

### 冪等実行
- 何度実行してもエラーにならない
- 既存データを保護
- `IF NOT EXISTS` で安全構築

### データ保護
- `DROP TABLE CASCADE` で古いテーブル完全削除
- 外部キー制約で整合性保証
- トランザクション安全

## 📊 統合後の利用可能機能

### 親アプリ
- ✅ 子供登録・管理（読み取り専用）
- ✅ 成長記録作成（写真付き）  
- ✅ カレンダー・予定管理
- ✅ AI チャット相談
- ✅ 管理者との直接チャット

### 管理アプリ
- ✅ 園児・保護者一括管理
- ✅ 出席・活動記録
- ✅ 園情報編集（設定画面）
- ✅ 園児削除機能
- ✅ 保護者アカウント作成
- ✅ 親との直接チャット

## 🚨 トラブルシューティング

### SQLエラーが発生した場合
```bash
# 権限確認
# Supabaseプロジェクトの所有者権限が必要

# 接続確認  
node execute_sql.js
```

### テーブル作成に失敗した場合
1. 既存テーブルの完全削除を確認
2. SQL全体を一度に実行（分割実行は非推奨）
3. エラーメッセージで該当行を確認

### 環境変数エラーの場合
```bash
# .env.local ファイルの存在確認
ls -la parent-app/.env.local admin-app/.env.local

# アプリ再起動
npm run dev
```

## 🎉 完了！

これで「きょうのできた」アプリの完全統合データベースが完成です！

- 🎯 **一つのSQLファイルで全機能構築**
- 🔗 **親アプリ⟷管理アプリ完全連携**
- 🛡️ **安全・確実な運用環境**
- ⚡ **スケーラブルなマルチテナント対応**

このmaster_database.sqlファイル一つで、あらゆる機能が動作します！


