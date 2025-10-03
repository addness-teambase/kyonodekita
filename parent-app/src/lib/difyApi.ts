// Dify APIとの通信を管理するモジュール

const DIFY_API_KEY = 'app-vicK9KuwfBESFtd7ZI16PSRO';
const DIFY_API_URL = 'https://api.dify.ai/v1';

interface DifyChatRequest {
    inputs: Record<string, any>;
    query: string;
    response_mode: 'blocking' | 'streaming';
    conversation_id?: string;
    user: string;
}

interface DifyChatResponse {
    event?: string;
    message_id: string;
    conversation_id: string;
    mode: string;
    answer: string;
    metadata?: {
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    };
    created_at: number;
}

/**
 * Dify APIを使ってAIと会話する
 * @param query ユーザーのメッセージ
 * @param conversationId 会話ID（継続する場合）
 * @param userId ユーザーID
 * @param additionalInputs 追加の入力パラメータ（子供の情報など）
 * @returns AI応答と会話ID
 */
export async function sendMessageToDify(
    query: string,
    conversationId: string | null,
    userId: string,
    additionalInputs: Record<string, any> = {}
): Promise<{ answer: string; conversationId: string }> {
    try {
        const requestBody: DifyChatRequest = {
            inputs: additionalInputs,
            query: query,
            response_mode: 'blocking',
            user: userId,
        };

        // 既存の会話がある場合は会話IDを含める
        if (conversationId) {
            requestBody.conversation_id = conversationId;
        }

        const response = await fetch(`${DIFY_API_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Dify APIエラー:', response.status, errorText);

            // レート制限エラー
            if (response.status === 429) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }

            throw new Error(`Dify API error: ${response.status} ${errorText}`);
        }

        const data: DifyChatResponse = await response.json();

        return {
            answer: data.answer || 'お話を聞かせていただき、ありがとうございます。もう少し詳しく教えていただけますか？',
            conversationId: data.conversation_id,
        };
    } catch (error) {
        console.error('Dify API通信エラー:', error);
        throw error;
    }
}

/**
 * 会話をリセットする（新しい会話を開始する）
 */
export function resetConversation(): void {
    // 会話IDをnullにすることで新しい会話を開始
    // 特別な処理は不要
}

