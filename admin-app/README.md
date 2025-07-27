# ストレスチェッカー

ストレス記録アプリ「きょうのできた」

## 開発方法

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動（localhost:5173）
npm run dev

# アプリをビルド
npm run build

# ビルドしたアプリをプレビュー
npm run preview
```

## デプロイ方法

このアプリケーションはGitHub Pagesにデプロイできるように設定されています。

1. GitHubにリポジトリを作成する
2. 以下のコマンドでリポジトリに接続してpushする

```bash
git init
git add .
git commit -m "初回コミット"
git branch -M main
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

3. GitHubのリポジトリ設定から「Pages」を開き、デプロイソースとして「GitHub Actions」を選択します
4. Push後、自動的にGitHub Actionsが実行され、アプリがデプロイされます
5. デプロイされたアプリは `https://ユーザー名.github.io/リポジトリ名/` でアクセスできます

注意: GitHubリポジトリ名を変更した場合は、`vite.config.ts`の`repoName`変数も合わせて変更してください。
