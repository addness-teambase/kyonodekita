# 🚀 きょうのできた - セットアップガイド

このガイドに従って、データベースとアプリケーションをセットアップします。

---

## 📦 前提条件

- Node.js (v18以上)
- npm
- Supabaseアカウント

---

## ⚡ クイックスタート（3ステップ）

### ステップ1: データベースセットアップ（5分）

1. **Supabaseにアクセス**
   - https://supabase.com/ を開く
   - プロジェクトを選択
   - 左メニュー「SQL Editor」をクリック

2. **SQLを実行**
   - 「New Query」をクリック
   - `shared/master_database.sql` の内容をコピー＆ペースト
   - 「Run」ボタンをクリック ▶️

3. **確認**
   - 左メニュー「Table Editor」で以下のテーブルが作成されていることを確認：
   - ✅ users, facilities, children, records, calendar_events, growth_records, など19個

### ステップ2: 環境変数設定（2分）

各アプリのルートに `.env.local` を作成：

**parent-app/.env.local**
```env
VITE_SUPABASE_URL=あなたのSupabaseURL
VITE_SUPABASE_ANON_KEY=あなたのSupabaseキー
VITE_GEMINI_API_KEY=あなたのGeminiAPIキー
```

**admin-app/.env.local**
```env
VITE_SUPABASE_URL=あなたのSupabaseURL
VITE_SUPABASE_ANON_KEY=あなたのSupabaseキー
```

**expert-admin-app/.env.local**
```env
VITE_SUPABASE_URL=あなたのSupabaseURL
VITE_SUPABASE_ANON_KEY=あなたのSupabaseキー
```

### ステップ3: アプリケーション起動（3分）

#### 依存関係のインストール
```bash
cd parent-app && npm install
cd ../admin-app && npm install
cd ../expert-admin-app && npm install
```

#### 3つのアプリを起動

**方法1: 自動起動スクリプト（推奨）**
```bash
./START_ALL_APPS.sh
```

**方法2: 手動起動（3つのターミナル）**

ターミナル1:
```bash
cd parent-app
npm run dev -- --port 5173
```

ターミナル2:
```bash
cd expert-admin-app
npm run dev -- --port 5174
```

ターミナル3:
```bash
cd admin-app
npm run dev -- --port 5175
```

---

## 🎯 アプリケーション一覧

| アプリ | URL | 説明 |
|--------|-----|------|
| 📱 親アプリ | http://localhost:5173 | 保護者用アプリ |
| 👨‍💼 専門家管理 | http://localhost:5174 | 専門家管理アプリ（ログイン: demo/demo） |
| 🏢 施設管理 | http://localhost:5175 | 施設管理アプリ |

---

## 📊 データベーステーブル（19個）

### 認証・ユーザー管理
- `users` - 親・管理者統一認証
- `facilities` - 園・事業所情報
- `facility_users` - 事業所職員
- `facility_memberships` - 所属関係

### 子供関連
- `children` - 子供基本情報
- `child_facility_relations` - 子供と園の関係
- `facility_children` - 園ごとの詳細情報

### 記録・活動
- `attendance_schedules` - 出席・活動記録
- `records` - 親の「できた」記録
- `calendar_events` - カレンダー・予定
- `growth_records` - 成長記録（写真付き）
- `daily_records` - 日記

### コミュニケーション
- `chat_sessions` - AI チャット
- `chat_messages` - AI チャット履歴
- `direct_chat_conversations` - 親⟷先生チャット
- `direct_chat_messages` - 直接チャット履歴

### 専門家相談（新機能）
- `experts` - 専門家情報
- `expert_consultations` - 相談予約
- `expert_announcements` - お知らせ

### その他
- `invitation_links` - 招待システム
- `ai_usage_logs` - AI 使用量追跡
- `data_retention_policies` - データ保持ポリシー

---

## 🧪 動作確認

### 1. 専門家管理アプリ（http://localhost:5174）
- ログイン: `demo` / `demo`
- 専門家を追加
- お知らせを送信

### 2. 親アプリ（http://localhost:5173）
- ホーム画面にお知らせが表示されるか確認
- 「相談」タブに専門家が表示されるか確認

### 3. 施設管理アプリ（http://localhost:5175）
- 園児・保護者管理機能を確認

---

## ⚠️ トラブルシューティング

### データベースエラー

**エラー: relation "xxx" does not exist**
→ `shared/master_database.sql` を再実行

**エラー: permission denied**
→ Supabaseプロジェクトの所有者権限を確認

### アプリ起動エラー

**ポートが使用中**
```bash
# 使用中のプロセスを確認
lsof -i :5173
# 別のポートを指定
npm run dev -- --port 5176
```

**環境変数が読み込めない**
- `.env.local` ファイルが正しい場所にあるか確認
- アプリを再起動

### データが表示されない
- ブラウザをリロード（F5）
- 開発者ツールのコンソールでエラーを確認

---

## 🛑 停止方法

**全アプリ停止**
```bash
pkill -f 'vite'
```

**個別停止**
各ターミナルで `Ctrl + C`

---

## 📝 次のステップ

1. ✅ データベースセットアップ完了
2. ✅ 3つのアプリ起動完了
3. 🔄 専門家を追加して動作確認
4. 📢 お知らせ機能をテスト
5. 💳 決済機能を実装（次フェーズ）

---

## 📚 参考ドキュメント

- `START_ALL_APPS.md` - アプリ起動詳細手順
- `TEST_CHECKLIST.md` - テストチェックリスト
- `shared/expert_admin_linkage_guide.md` - 専門家管理連携ガイド
- `shared/expert_consultation_requirements.md` - 要件定義
- `shared/payment_service_comparison.md` - 決済サービス比較

---

**セットアップ完了後は、上記の動作確認を行ってください！** 🎉
