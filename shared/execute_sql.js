#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数から設定を読み込み
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase環境変数が見つかりません');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 設定済み' : '❌ 未設定');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ 設定済み' : '❌ 未設定');
    process.exit(1);
}

console.log('=== 🚀 Supabase SQLスクリプト実行 ===');
console.log('接続先:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile() {
    try {
        // 統合SQLファイルを読み込み
        const sqlFilePath = path.join(__dirname, 'master_database.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📂 SQLファイル読み込み完了');
        console.log('📏 SQLサイズ:', sqlContent.length, '文字');
        console.log('');

        // SQLを実行（Supabaseの場合、通常は個別のクエリに分割する必要があります）
        console.log('⚠️  注意: AnonymousキーではDDL操作は実行できません');
        console.log('💡 このスクリプトはSupabase管理画面のSQL Editorで実行してください');
        console.log('');
        console.log('🔗 Supabase管理画面にアクセス:');
        console.log('   https://supabase.com/dashboard/project/ognianlobgsqcjpacgqo/sql');
        console.log('');

        // テーブル存在確認のテスト
        console.log('=== 📊 現在のテーブル確認 ===');
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (error) {
            console.log('ℹ️  テーブル情報の取得に失敗:', error.message);
            console.log('   これは正常です（権限制限）');
        } else {
            console.log('✅ 公開テーブル:', tables?.map(t => t.table_name).join(', ') || 'なし');
        }

        console.log('');
        console.log('=== 📋 次の手順 ===');
        console.log('1. master_database.sql の内容をコピー');
        console.log('2. 上記URLのSQL Editorで貼り付け');
        console.log('3. Runボタンをクリック');
        console.log('4. すべてのテーブル・機能が一度に作成完了！');

    } catch (error) {
        console.error('❌ エラー発生:', error.message);
        process.exit(1);
    }
}

executeSQLFile();

