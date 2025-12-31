#!/bin/bash

# きょうのできた - 全アプリ起動スクリプト

echo "🚀 すべてのアプリを起動します..."

# プロジェクトのルートディレクトリ
PROJECT_ROOT="/Users/kurosakiyuto/Downloads/開発/きょうのできた"

# 各アプリのディレクトリ
PARENT_APP="$PROJECT_ROOT/parent-app"
EXPERT_ADMIN_APP="$PROJECT_ROOT/expert-admin-app"
ADMIN_APP="$PROJECT_ROOT/admin-app"

# ポート番号
PARENT_PORT=5173
EXPERT_ADMIN_PORT=5174
ADMIN_PORT=5175

echo ""
echo "📱 1. 親アプリ (parent-app) - http://localhost:$PARENT_PORT"
cd "$PARENT_APP"
npm run dev -- --port $PARENT_PORT > /dev/null 2>&1 &
PARENT_PID=$!
echo "   ✅ 起動中... (PID: $PARENT_PID)"

sleep 2

echo ""
echo "👨‍💼 2. 専門家管理アプリ (expert-admin-app) - http://localhost:$EXPERT_ADMIN_PORT"
cd "$EXPERT_ADMIN_APP"
npm run dev -- --port $EXPERT_ADMIN_PORT > /dev/null 2>&1 &
EXPERT_ADMIN_PID=$!
echo "   ✅ 起動中... (PID: $EXPERT_ADMIN_PID)"

sleep 2

echo ""
echo "🏢 3. 施設管理アプリ (admin-app) - http://localhost:$ADMIN_PORT"
cd "$ADMIN_APP"
npm run dev -- --port $ADMIN_PORT > /dev/null 2>&1 &
ADMIN_PID=$!
echo "   ✅ 起動中... (PID: $ADMIN_PID)"

sleep 3

echo ""
echo "✨ 全アプリ起動完了！"
echo ""
echo "📱 親アプリ:        http://localhost:$PARENT_PORT"
echo "👨‍💼 専門家管理:      http://localhost:$EXPERT_ADMIN_PORT"
echo "🏢 施設管理:        http://localhost:$ADMIN_PORT"
echo ""
echo "停止するには: pkill -f 'vite' または各ターミナルで Ctrl+C"





