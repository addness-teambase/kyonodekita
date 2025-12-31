# 専門家とのZoom相談機能 要件定義書

## 📋 概要

親アプリに専門家（先生）とのZoom相談を予約・決済する機能を追加します。

---

## 1. 機能概要

### 1.1 目的
- 保護者が専門家（先生）とZoomで相談できる機能を提供
- 予約から決済まで一貫したフローを実現
- タイムレックスと連携してスケジュール管理を行う

### 1.2 対象ユーザー
- **親アプリの利用者（保護者）**: 予約・決済を行う
- **管理者アプリの利用者（先生）**: 予約を確認・管理する

---

## 2. 料金体系

### 2.1 基本料金
- **相談料金**: 1回あたり **3,000円**（税込）
- **先生ごとの料金**: 全先生で統一料金
- **相談時間**: タイムレックスで管理（相談時に決定）

### 2.2 支払いタイミング
- **前払い**: 予約確定時に決済
- **キャンセルポリシー**: 後述

---

## 3. 先生（専門家）情報管理

### 3.1 管理する先生数
- **初期**: 5名の先生を登録

### 3.2 先生の情報項目
| 項目 | 必須 | 説明 |
|------|------|------|
| 名前 | ✅ | 先生のフルネーム |
| プロフィール写真 | ✅ | 顔写真（推奨サイズ: 300x300px以上） |
| 自己紹介文 | ✅ | 先生の経歴や専門分野を説明する文章 |
| 紹介文 | ✅ | 相談内容の例や期待できる効果などを説明する文章 |
| 料金 | ✅ | 1回あたりの料金（初期: 3,000円） |
| タイムレックスURL | ✅ | 予約ページへのリンク |

### 3.3 データベース設計
```sql
-- 専門家（先生）テーブル
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  profile_image_url TEXT,
  self_introduction TEXT NOT NULL, -- 自己紹介文
  description TEXT NOT NULL, -- 紹介文
  consultation_fee INTEGER NOT NULL DEFAULT 3000, -- 料金（円）
  timerex_url TEXT NOT NULL, -- タイムレックスの予約URL
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 管理者アカウントとの紐付け（予約管理用）
  display_order INTEGER DEFAULT 0, -- 表示順序
  is_active BOOLEAN DEFAULT TRUE, -- 有効/無効
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_experts_admin_user_id ON experts(admin_user_id);
```

---

## 4. 予約機能

### 4.1 予約フロー（最終版：時間選択→決済→予約完了）

1. **ナビゲーションタブから「専門家相談」を選択**
   - ボトムナビゲーションに新しいタブを追加
   - アイコン: `UserCircle` または `Video`（lucide-react）

2. **先生一覧を表示**
   - 5名の先生のカードを一覧表示
   - 各カードに表示する情報:
     - プロフィール写真
     - 名前
     - 自己紹介文（一部）
     - 料金

3. **先生を選択**
   - 先生のカードをタップすると詳細ページへ遷移
   - 詳細ページに表示する情報:
     - プロフィール写真（大きく）
     - 名前
     - 自己紹介文（全文）
     - 紹介文（全文）
     - 料金
     - 「相談する」ボタン

4. **予約情報の入力**
   - 「相談する」ボタンをタップ
   - モーダルを表示
   - 「ちょっとどうしたらいいか」というコメント欄を表示
   - コメント入力後、「時間を選ぶ」ボタンを表示

5. **タイムレックスで時間選択**
   - 「時間を選ぶ」ボタンをタップ
   - タイムレックスのURLへ遷移
   - タイムレックス側で希望の日時を選択
   - 時間選択完了後、タイムレックスから選択した日時情報を取得
   - 予約情報をデータベースに保存（status: `time_selected`）
   - 選択した日時を表示して確認

6. **決済処理**
   - 時間選択確認後、「決済に進む」ボタンを表示
   - 決済リンクまたは決済画面を表示
   - 決済方法を選択（クレジットカード、PayPayなど）
   - 決済を実行
   - **決済完了後、予約情報を更新（status: `paid` → `booked`）**

7. **予約完了・Zoomリンク表示**
   - 決済完了後、予約完了画面を表示
   - 予約確定通知を表示
   - **Zoomリンクを表示**（タイムレックスから取得またはシステムで管理）
   - 予約詳細ページに予約情報とZoomリンクを保存

### 4.2 予約の状態管理

| 状態 | 説明 | 次のアクション |
|------|------|---------------|
| `pending` | コメント入力済み（時間未選択） | タイムレックスで時間選択 |
| `time_selected` | 時間選択済み（未支払い） | 決済処理 |
| `paid` | 支払い済み（決済完了中） | 予約確定処理 |
| `booked` | 予約完了（Zoomリンクあり） | 相談待ち |
| `completed` | 相談完了 | - |
| `cancelled` | キャンセル済み | - |

**状態遷移フロー**:
```
pending → time_selected → paid → booked → completed
   ↓            ↓              ↓
cancelled   cancelled     cancelled
```

**注意**: `paid`状態は非常に短時間（決済完了から予約確定までの瞬間）で、通常は`booked`状態にすぐ遷移します。

### 4.3 データベース設計
```sql
-- 予約テーブル
CREATE TABLE expert_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- 相談対象の子供（任意）
  expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
  
  -- 予約情報
  consultation_date TIMESTAMP WITH TIME ZONE, -- 相談日時（タイムレックスで時間選択後に設定）
  consultation_comment TEXT, -- 「ちょっとどうしたらいいか」コメント
  timerex_booking_id TEXT, -- タイムレックスの予約ID（決済完了後に設定）
  zoom_link TEXT, -- Zoomミーティングリンク（予約完了後に設定）
  
  -- 支払い情報
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'time_selected', 'paid', 'booked', 'completed', 'cancelled')),
  amount INTEGER NOT NULL, -- 支払い金額
  payment_method VARCHAR(50), -- 決済方法（'stripe', 'paypay'など）
  payment_id TEXT, -- 決済サービスの決済ID
  paid_at TIMESTAMP WITH TIME ZONE, -- 支払い日時
  
  -- 予約者情報（誰が予約したか）
  parent_name TEXT, -- 保護者名（冗長化）
  parent_email TEXT, -- 保護者メールアドレス
  parent_phone TEXT, -- 保護者電話番号
  
  -- キャンセル情報
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- メタ情報
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_expert_consultations_user_id ON expert_consultations(user_id);
CREATE INDEX idx_expert_consultations_expert_id ON expert_consultations(expert_id);
CREATE INDEX idx_expert_consultations_status ON expert_consultations(status);
CREATE INDEX idx_expert_consultations_consultation_date ON expert_consultations(consultation_date);

-- RLS（Row Level Security）ポリシー
-- 保護者は自分の予約のみ閲覧可能
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "保護者は自分の予約を閲覧可能"
  ON expert_consultations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "保護者は自分の予約を作成可能"
  ON expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理者（先生）は自分の予約を閲覧可能（expert_idとadmin_user_idで紐付け）
CREATE POLICY "管理者は自分の予約を閲覧可能"
  ON expert_consultations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experts
      WHERE experts.id = expert_consultations.expert_id
      AND experts.admin_user_id = auth.uid()
    )
  );
```

---

## 5. 決済機能

### 5.1 決済サービスの選定

#### 調査結果

**PayPay（オンライン決済）**
- **ユーザー数**: 7,100万人以上
- **利用率**: オンライン決済で約24%
- **メリット**: 
  - 日本で最も利用されているQRコード決済
  - 親御さんの利用可能性が高い
- **デメリット**:
  - 専用のAPI統合が必要
  - 審査・承認プロセスが必要な可能性

**Stripe**
- **対応決済**: クレジットカード、PayPay、Apple Pay、Google Payなど
- **メリット**:
  - 多様な決済手段を1つのAPIで統合可能
  - 開発者向けドキュメントが充実
  - 国際的な信頼性
  - PayPayもStripe経由で統合可能
- **デメリット**:
  - 手数料が発生（約3.6% + 固定料）
- **手数料**: 
  - 国内カード: 3.6% + 40円
  - 国際カード: 3.6% + 40円
  - PayPay: 別途確認必要

**推奨案**
- **第1候補**: **Stripe**（PayPayとクレジットカードの両方に対応可能）
- **第2候補**: **PayPayオンライン決済**（PayPayに特化する場合）

### 5.2 決済フロー（最終版：時間選択→決済→予約完了）

#### オプション1: Stripeを使用する場合

1. **時間選択完了後、決済画面へ遷移**
   - タイムレックスで時間選択完了
   - 選択した日時を確認画面に表示
   - 予約情報をシステムに保存（status: `time_selected`）
   - 「決済に進む」ボタンをタップして決済画面へ遷移

2. **決済方法の選択**
   - クレジットカード
   - PayPay（Stripe経由）

3. **決済実行**
   - Stripe CheckoutまたはStripe Elementsを使用
   - 決済成功後、StripeからWebhookで通知
   - 予約のstatusを`paid`に更新

4. **予約完了処理**
   - 決済完了後、タイムレックスの予約IDを取得・保存
   - Zoomリンクを生成またはタイムレックスから取得
   - 予約のstatusを`booked`に更新
   - 予約完了画面を表示（Zoomリンクを含む）

#### オプション2: PayPayオンライン決済を使用する場合

1. **時間選択完了後、決済画面へ遷移**
   - タイムレックスで時間選択完了
   - 選択した日時を確認画面に表示
   - 予約情報をシステムに保存（status: `time_selected`）
   - 「決済に進む」ボタンをタップして決済画面へ遷移

2. **PayPay決済**
   - PayPay APIを使用して決済リンクを生成
   - QRコードまたはリンクを表示

3. **決済完了・予約確定**
   - PayPayからコールバックで通知
   - タイムレックスの予約IDを取得・保存
   - Zoomリンクを生成またはタイムレックスから取得
   - 予約のstatusを`booked`に更新
   - 予約完了画面を表示（Zoomリンクを含む）

### 5.3 キャンセル・返金ポリシー

| キャンセルタイミング | 返金 | 備考 |
|---------------------|------|------|
| 相談日の24時間前まで | 全額返金 | 自動返金処理 |
| 相談日の24時間以内 | 返金なし | キャンセル不可とする |

**実装案**:
- キャンセルボタンは相談日の24時間前まで表示
- 24時間以内はキャンセル不可
- 返金は自動処理（Stripe/PayPayの返金APIを使用）

---

## 6. UI/UX設計

### 6.1 ナビゲーションタブ

**追加場所**: ボトムナビゲーションバー

**新しいタブ**:
- **アイコン**: `UserCircle` または `Video`（lucide-react）
- **ラベル**: 「相談」
- **タブID**: `expert_consultation`

**表示位置**: チャットの前（右から2番目）

### 6.2 先生一覧画面

**レイアウト**:
- カード形式で先生を表示
- 各カード:
  - 左側: プロフィール写真（円形、サイズ: 80x80px）
  - 右側: 名前、自己紹介文（2行まで）、料金

**アクション**:
- カードタップで詳細ページへ遷移

### 6.3 先生詳細画面

**レイアウト**:
- 上部: プロフィール写真（大きく表示）
- 名前（大きく）
- 自己紹介文（全文）
- 紹介文（全文）
- 料金表示
- 「相談する」ボタン（固定ボタン）

**「相談する」ボタンタップ時**:
- モーダルを表示
- モーダル内容:
  - 「ちょっとどうしたらいいか」テキストエリア
  - 「時間を選ぶ」ボタン（タイムレックスへ遷移）

**時間選択完了後**:
- 選択した日時を確認画面に表示
- 「決済に進む」ボタンを表示

**決済完了後**:
- 予約完了画面を表示
- Zoomリンクを表示
- 予約詳細ページへのリンクを表示

### 6.4 予約一覧画面（保護者側）

- ユーザーの予約履歴を表示
- 予約状態ごとにフィルタリング可能
- 予約詳細から決済・キャンセルが可能
- 表示項目:
  - 先生名
  - 予約日時
  - 予約状態
  - 料金
  - コメント
  - Zoomリンク（予約完了後）

**予約詳細画面（保護者側）**:
- 予約の詳細情報を表示
- Zoomリンクの表示・コピー機能
- 予約のキャンセル機能

### 6.5 予約管理画面（管理者側・先生側）

**管理者アプリに追加する機能**:

- **予約一覧画面**
  - 自分の予約（expert_idで紐付け）を一覧表示
  - 予約状態ごとにフィルタリング可能
  - 表示項目:
    - 保護者名
    - 予約日時
    - 予約状態
    - 料金
    - コメント（「ちょっとどうしたらいいか」）
    - 子供の情報（任意）
    - Zoomリンク（予約完了後）

- **予約詳細画面**
  - 予約の詳細情報を表示
  - Zoomリンクの表示・コピー機能
  - 予約状態の更新（例: `booked` → `completed`）
  - キャンセル処理（返金処理も含む）

- **予約統計**
  - 月間予約数
  - 予約状態別の集計
  - 売上合計

**UI/UX**:
- 管理者アプリの既存ナビゲーションに「予約管理」を追加
- カレンダービューとリストビューを切り替え可能

---

## 7. 実装フェーズ

### フェーズ1: 基本機能実装（第1優先）
- [ ] データベーステーブル作成（`experts`, `expert_consultations`）
- [ ] RLS（Row Level Security）ポリシーの設定
- [ ] 親アプリ: ナビゲーションタブ追加
- [ ] 親アプリ: 先生一覧画面の実装
- [ ] 親アプリ: 先生詳細画面の実装
- [ ] 親アプリ: 「相談する」ボタンとコメント入力モーダル
- [ ] 親アプリ: タイムレックスでの時間選択機能
- [ ] 親アプリ: 時間選択後の確認画面
- [ ] 親アプリ: 予約情報の保存（status: `pending` → `time_selected`）

### フェーズ2: 決済機能実装（第2優先）
- [ ] StripeまたはPayPayの統合
- [ ] 親アプリ: 決済画面の実装
- [ ] 決済状態の管理（status: `time_selected` → `paid` → `booked`）
- [ ] Webhook/コールバック処理
- [ ] タイムレックス予約IDの取得・保存
- [ ] Zoomリンクの生成・取得・保存
- [ ] 予約完了画面の実装（Zoomリンク表示）

### フェーズ3: 予約管理機能（第3優先）
- [ ] 親アプリ: 予約一覧画面の実装
- [ ] 親アプリ: 予約詳細画面の実装
- [ ] 管理者アプリ: 予約管理画面の実装
- [ ] 管理者アプリ: 予約一覧・詳細表示
- [ ] 管理者アプリ: 予約状態の更新機能
- [ ] キャンセル機能の実装
- [ ] 返金処理の実装

### フェーズ4: その他機能（将来的に）
- [ ] 予約リマインダー通知
- [ ] Zoom URLの自動送信
- [ ] 相談後のフィードバック機能

---

## 8. 技術仕様

### 8.1 フロントエンド
- **フレームワーク**: React + TypeScript
- **UIライブラリ**: Tailwind CSS
- **アイコン**: lucide-react
- **状態管理**: React Context（既存の構造に合わせる）

### 8.2 バックエンド
- **データベース**: Supabase（PostgreSQL）
- **認証**: Supabase Auth（既存の認証システムを使用）
- **決済API**: StripeまたはPayPay API

### 8.3 外部連携
- **タイムレックス**: URLリンクで遷移（将来的にAPI連携も検討）

---

## 9. セキュリティ・プライバシー

### 9.1 データ保護
- 個人情報の暗号化
- 決済情報は決済サービス側で管理（システム側では保存しない）
- 予約情報はRLS（Row Level Security）で保護

### 9.2 アクセス制御
- **保護者**: 自分の予約のみ閲覧・作成可能
- **管理者（先生）**: 自分の予約（expert_idで紐付け）のみ閲覧可能
- RLS（Row Level Security）でデータアクセスを制御

---

## 10. 課題・検討事項

### 10.1 決済サービスの最終選定
- [ ] Stripeの導入審査・承認
- [ ] PayPayオンライン決済の導入審査・承認
- [ ] 手数料の最終確認
- [ ] 開発者向けドキュメントの確認

### 10.2 タイムレックス連携
- [ ] タイムレックス側のAPI仕様確認
- [ ] 時間選択後のコールバックURL設定
- [ ] 選択した日時情報の取得方法
- [ ] 予約確定後のコールバックURL設定
- [ ] 予約IDの管理方法
- [ ] Zoomリンクの取得方法（タイムレックスから取得するか、システムで生成するか）

### 10.3 先生情報の管理
- [ ] 先生情報の登録方法（管理画面で手動登録？）
- [ ] 先生情報の更新方法
- [ ] 先生と管理者アカウントの紐付け方法（expert_idとusersテーブルの関連）

### 10.4 予約管理の自動化
- [ ] タイムレックスからの時間選択完了通知の受信方法
- [ ] タイムレックスからの予約完了通知の受信方法
- [ ] 予約状態の自動更新（`time_selected` → `paid` → `booked`）
- [ ] 予約者情報の自動取得（usersテーブルから）
- [ ] Zoomリンクの自動生成またはタイムレックスからの取得

---

## 11. 参考資料

- [Stripe Japan 公式サイト](https://stripe.com/jp)
- [PayPay オンライン決済](https://paypay.ne.jp/store-online/)
- [タイムレックス](https://timerex.net/)

---

## 12. 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2025-01-XX | 初版作成 | - |
| 2025-01-XX | 決済フローを「決済先行」に変更、管理者側の予約管理機能を追加 | - |
| 2025-01-XX | フローを「時間選択→決済→予約完了」に変更、Zoomリンク表示を追加 | - |

