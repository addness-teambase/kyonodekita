# 🚀 全アプリ起動ガイド

## 📱 起動するアプリ（3つ）

1. **parent-app** - 親アプリ（保護者用）
2. **expert-admin-app** - 専門家管理アプリ
3. **admin-app** - 施設管理アプリ（既存）

---

## 🎯 方法1: 自動起動スクリプト（推奨）

### Mac/Linux

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた"
chmod +x START_ALL_APPS.sh
./START_ALL_APPS.sh
```

### Windows (PowerShell)

```powershell
cd "C:\Users\kurosakiyuto\Downloads\開発\きょうのできた"
# 3つのターミナルを開いてそれぞれ実行
```

---

## 🎯 方法2: 手動起動（3つのターミナル）

### ターミナル1: 親アプリ

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた/parent-app"
npm run dev -- --port 5173
```

**URL:** http://localhost:5173

---

### ターミナル2: 専門家管理アプリ

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた/expert-admin-app"
npm run dev -- --port 5174
```

**URL:** http://localhost:5174

---

### ターミナル3: 施設管理アプリ

```bash
cd "/Users/kurosakiyuto/Downloads/開発/きょうのできた/admin-app"
npm run dev -- --port 5175
```

**URL:** http://localhost:5175

---

## ✅ 起動確認

### 1. 親アプリ (http://localhost:5173)
- ✅ ログイン画面が表示される
- ✅ ホーム画面が表示される

### 2. 専門家管理アプリ (http://localhost:5174)
- ✅ ログイン画面が表示される
- ✅ `demo` / `demo` でログインできる

### 3. 施設管理アプリ (http://localhost:5175)
- ✅ ログイン画面が表示される

---

## 🛑 停止方法

### 全て停止

```bash
pkill -f 'vite'
```

### 個別停止

各ターミナルで `Ctrl + C`

---

## 🔧 ポートが競合する場合

既にポートが使われている場合は、別のポートを指定：

```bash
npm run dev -- --port 5176
```

---

## 📝 確認手順

1. ✅ 3つとも起動できた
2. ✅ 専門家管理アプリで専門家を追加
3. ✅ 専門家管理アプリでお知らせを送信
4. ✅ 親アプリのホーム画面にお知らせが表示される
5. ✅ 親アプリの「相談」タブに専門家が表示される

---

## 🎯 今すぐやること

```bash
# 3つのターミナルを開いて...

# ターミナル1
cd parent-app && npm run dev -- --port 5173

# ターミナル2  
cd expert-admin-app && npm run dev -- --port 5174

# ターミナル3
cd admin-app && npm run dev -- --port 5175
```

全て起動したら動作確認開始！🚀





