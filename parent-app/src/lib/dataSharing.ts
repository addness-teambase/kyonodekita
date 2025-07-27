import { supabase } from './supabase';

export interface AnonymizedData {
    id: string;
    category: string;
    data_type: string;
    anonymized_data: any;
    child_age: number | null;
    child_gender: 'male' | 'female' | null;
    created_at: string;
}

export interface DataAnalytics {
    recordsByCategory: Record<string, number>;
    recordsByAgeGroup: Record<string, number>;
    recordsByGender: Record<string, number>;
    totalRecords: number;
    averageRecordsPerDay: number;
    commonPatterns: string[];
}

// 匿名化データを公開テーブルに保存
export const shareAnonymizedData = async (
    category: string,
    dataType: string,
    data: any,
    childAge?: number,
    childGender?: 'male' | 'female'
): Promise<void> => {
    try {
        await supabase
            .from('public_data')
            .insert({
                category,
                data_type: dataType,
                anonymized_data: data,
                child_age: childAge,
                child_gender: childGender
            });
    } catch (error) {
        console.error('匿名化データの共有エラー:', error);
    }
};

// 公開データの取得
export const getPublicData = async (
    category?: string,
    dataType?: string,
    ageMin?: number,
    ageMax?: number,
    gender?: 'male' | 'female'
): Promise<AnonymizedData[]> => {
    try {
        let query = supabase
            .from('public_data')
            .select('*')
            .order('created_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        if (dataType) {
            query = query.eq('data_type', dataType);
        }

        if (ageMin !== undefined) {
            query = query.gte('child_age', ageMin);
        }

        if (ageMax !== undefined) {
            query = query.lte('child_age', ageMax);
        }

        if (gender) {
            query = query.eq('child_gender', gender);
        }

        const { data, error } = await query;

        if (error) {
            console.error('公開データの取得エラー:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('公開データの取得エラー:', error);
        return [];
    }
};

// データ分析結果の取得
export const getDataAnalytics = async (
    category?: string,
    ageMin?: number,
    ageMax?: number
): Promise<DataAnalytics> => {
    try {
        const data = await getPublicData(category, undefined, ageMin, ageMax);

        const recordsByCategory: Record<string, number> = {};
        const recordsByAgeGroup: Record<string, number> = {};
        const recordsByGender: Record<string, number> = {};

        data.forEach(record => {
            // カテゴリ別集計
            const dataType = record.data_type;
            recordsByCategory[dataType] = (recordsByCategory[dataType] || 0) + 1;

            // 年齢グループ別集計
            if (record.child_age !== null) {
                const ageGroup = getAgeGroup(record.child_age);
                recordsByAgeGroup[ageGroup] = (recordsByAgeGroup[ageGroup] || 0) + 1;
            }

            // 性別集計
            if (record.child_gender) {
                recordsByGender[record.child_gender] = (recordsByGender[record.child_gender] || 0) + 1;
            }
        });

        // 共通パターンの抽出
        const commonPatterns = extractCommonPatterns(data);

        // 1日あたりの平均記録数を計算
        const uniqueDays = new Set(data.map(record =>
            new Date(record.created_at).toDateString()
        )).size;
        const averageRecordsPerDay = uniqueDays > 0 ? data.length / uniqueDays : 0;

        return {
            recordsByCategory,
            recordsByAgeGroup,
            recordsByGender,
            totalRecords: data.length,
            averageRecordsPerDay,
            commonPatterns
        };
    } catch (error) {
        console.error('データ分析エラー:', error);
        return {
            recordsByCategory: {},
            recordsByAgeGroup: {},
            recordsByGender: {},
            totalRecords: 0,
            averageRecordsPerDay: 0,
            commonPatterns: []
        };
    }
};

// 年齢グループの判定
const getAgeGroup = (age: number): string => {
    if (age < 1) return '0歳';
    if (age < 3) return '1-2歳';
    if (age < 6) return '3-5歳';
    if (age < 10) return '6-9歳';
    if (age < 15) return '10-14歳';
    return '15歳以上';
};

// 共通パターンの抽出
const extractCommonPatterns = (data: AnonymizedData[]): string[] => {
    const patterns: string[] = [];

    // カテゴリ別の時間帯パターン
    const hourlyPatterns: Record<string, number[]> = {};

    data.forEach(record => {
        const hour = new Date(record.created_at).getHours();
        const dataType = record.data_type;

        if (!hourlyPatterns[dataType]) {
            hourlyPatterns[dataType] = new Array(24).fill(0);
        }
        hourlyPatterns[dataType][hour]++;
    });

    // 最も活発な時間帯を特定
    Object.entries(hourlyPatterns).forEach(([dataType, hours]) => {
        const maxHour = hours.indexOf(Math.max(...hours));
        patterns.push(`${dataType}は${maxHour}時台に最も多く記録されています`);
    });

    return patterns.slice(0, 5); // 上位5パターンを返す
};

// 特定の子供の年齢・性別に基づく推奨データの取得
export const getRecommendedData = async (
    childAge: number,
    childGender: 'male' | 'female'
): Promise<AnonymizedData[]> => {
    try {
        // 同じ年齢±1歳、同じ性別のデータを取得
        return await getPublicData(
            'record',
            undefined,
            childAge - 1,
            childAge + 1,
            childGender
        );
    } catch (error) {
        console.error('推奨データの取得エラー:', error);
        return [];
    }
};

// 成長記録の匿名化データを共有
export const shareGrowthRecord = async (
    category: string,
    hasMedia: boolean,
    childAge: number,
    childGender?: 'male' | 'female'
): Promise<void> => {
    await shareAnonymizedData(
        'growth_record',
        category,
        {
            hasMedia,
            timestamp: new Date().toISOString()
        },
        childAge,
        childGender
    );
};

// カレンダーイベントの匿名化データを共有
export const shareCalendarEvent = async (
    eventType: string,
    hasTime: boolean,
    childAge?: number,
    childGender?: 'male' | 'female'
): Promise<void> => {
    await shareAnonymizedData(
        'calendar_event',
        eventType,
        {
            hasTime,
            timestamp: new Date().toISOString()
        },
        childAge,
        childGender
    );
}; 