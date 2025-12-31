/**
 * Stripe決済連携
 */

export interface StripePaymentLinkParams {
  expertId: string;
  expertName: string;
  amount: number;
  userId: string;
}

/**
 * Stripe決済リンクを生成
 *
 * 注意: 本番環境では、セキュリティのためバックエンド（Supabase Edge Functions）で実装する必要があります
 */
export const createStripePaymentLink = async (params: StripePaymentLinkParams): Promise<string> => {
  const { expertId, expertName, amount, userId } = params;

  // TODO: 本番環境では Supabase Edge Functions で実装
  // 現在はデモ用として、Stripeの決済リンク（Payment Links）を直接使用する想定

  // Stripeの決済リンク（事前に作成したもの）を返す
  // 本番では動的に生成する必要があります

  // デモ用: metadata にユーザー情報を含めたURLを返す
  const metadata = encodeURIComponent(JSON.stringify({
    expert_id: expertId,
    expert_name: expertName,
    user_id: userId,
    amount: amount
  }));

  // TODO: 実際のStripe Payment Link URLに置き換える
  // 例: https://buy.stripe.com/test_xxxxxxxxxxxxx
  const stripePaymentLink = `https://buy.stripe.com/test_example?client_reference_id=${userId}&prefilled_email=${userId}`;

  // 決済完了後のリダイレクト先を設定
  // success_url: アプリのドメイン/booking-success?session_id={CHECKOUT_SESSION_ID}
  // cancel_url: アプリのドメイン/booking-cancel

  return stripePaymentLink;
};

/**
 * Stripe Checkout Sessionから予約情報を取得
 */
export const getCheckoutSession = async (sessionId: string) => {
  // TODO: バックエンドから取得
  // Supabase Edge Functions経由でStripe APIを呼び出す

  return {
    sessionId,
    paymentStatus: 'paid',
    amount: 3000,
    expertId: 'demo-expert-1',
    userId: 'demo-user-1'
  };
};

/**
 * 予約データをデータベースに保存
 */
export const saveBooking = async (bookingData: {
  userId: string;
  expertId: string;
  amount: number;
  stripeSessionId: string;
  status: 'paid' | 'pending';
}) => {
  // Supabaseに保存
  // expert_consultations テーブルに挿入
  console.log('予約データを保存:', bookingData);

  // TODO: Supabase API実装
  return {
    id: 'booking-' + Date.now(),
    ...bookingData,
    createdAt: new Date().toISOString()
  };
};
