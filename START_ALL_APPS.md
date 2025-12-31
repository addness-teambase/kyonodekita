# 全アプリ起動ガイド

## 起動するアプリ（2つ）

1. **parent-app** - 親アプリ（保護者用）
2. **admin-app** - 施設管理アプリ

---

## 方法1: 自動起動スクリプト（推奨）

### Mac/Linux

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた"
chmod +x START_ALL_APPS.sh
./START_ALL_APPS.sh
```

---

## 方法2: 手動起動（2つのターミナル）

### ターミナル1: 親アプリ

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた/parent-app"
npm run dev -- --port 5173
```

**URL:** http://localhost:5173

---

### ターミナル2: 施設管理アプリ

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた/admin-app"
npm run dev -- --port 5175
```

**URL:** http://localhost:5175

---

## 起動確認

### 1. 親アプリ (http://localhost:5173)
- ログイン画面が表示される
- ホーム画面が表示される

### 2. 施設管理アプリ (http://localhost:5175)
- ログイン画面が表示される

---

## 停止方法

### 全て停止

```bash
pkill -f 'vite'
```

### 個別停止

各ターミナルで `Ctrl + C`

---

## ポートが競合する場合

既にポートが使われている場合は、別のポートを指定：

```bash
npm run dev -- --port 5176
```
