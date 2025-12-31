# きょうのできた

子どもの日々の成長や達成を記録・共有するためのアプリケーションです。

## 概要

「きょうのできた」は、保護者と保育施設が連携して子どもの成長を記録・共有できるプラットフォームです。

## アプリ構成

| アプリ | 説明 | ポート |
|--------|------|--------|
| **parent-app** | 保護者向けアプリ | 5173 |
| **admin-app** | 施設管理者向けアプリ | 5175 |

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (認証・データベース・ストレージ)
- **AI機能**: Google Gemini API, Dify API

## セットアップ

### 必要な環境

- Node.js 18以上
- npm

### インストール

```bash
# parent-app
cd parent-app
npm install

# admin-app
cd admin-app
npm install
```

### 環境変数

各アプリの`.env.local`ファイルを作成し、以下の変数を設定してください：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_GENAI_API_KEY=your_google_genai_api_key
VITE_DIFY_API_KEY=your_dify_api_key
```

## 起動方法

### 自動起動（推奨）

```bash
chmod +x START_ALL_APPS.sh
./START_ALL_APPS.sh
```

### 手動起動

```bash
# ターミナル1: 親アプリ
cd parent-app
npm run dev -- --port 5173

# ターミナル2: 施設管理アプリ
cd admin-app
npm run dev -- --port 5175
```

## 主な機能

### 保護者向けアプリ (parent-app)

- 子どもの日々の達成記録
- カレンダー表示
- 成長記録の振り返り
- 施設からの記録確認
- AIチャット相談
- 施設とのダイレクトチャット

### 施設管理アプリ (admin-app)

- 園児の記録管理
- 保護者への連絡
- お知らせ配信
- 記録の共有

## ディレクトリ構成

```
きょうのできた/
├── parent-app/          # 保護者向けアプリ
├── admin-app/           # 施設管理アプリ
├── shared/              # 共有ファイル（SQL等）
├── docs/                # ドキュメント
├── START_ALL_APPS.sh    # 起動スクリプト
└── SETUP.md             # セットアップガイド
```

## ライセンス

Private
