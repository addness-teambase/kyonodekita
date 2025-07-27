import { supabase } from './supabase';
import { AnonymizedData, DataAnalytics } from './dataSharing';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ApiFilters {
    category?: string;
    dataType?: string;
    ageMin?: number;
    ageMax?: number;
    gender?: 'male' | 'female';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}

export interface TrendData {
    date: string;
    count: number;
    category: string;
}

export interface AgeDistribution {
    ageGroup: string;
    count: number;
    percentage: number;
}

export interface CategoryInsights {
    category: string;
    totalCount: number;
    avgPerDay: number;
    peakHours: number[];
    commonPatterns: string[];
}

class AnalyticsApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    // 匿名化データの取得
    async getAnonymizedData(filters: ApiFilters = {}): Promise<ApiResponse<AnonymizedData[]>> {
        try {
            let query = supabase
                .from('public_data')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });

            // フィルタリング
            if (filters.category) {
                query = query.eq('category', filters.category);
            }

            if (filters.dataType) {
                query = query.eq('data_type', filters.dataType);
            }

            if (filters.ageMin !== undefined) {
                query = query.gte('child_age', filters.ageMin);
            }

            if (filters.ageMax !== undefined) {
                query = query.lte('child_age', filters.ageMax);
            }

            if (filters.gender) {
                query = query.eq('child_gender', filters.gender);
            }

            if (filters.dateFrom) {
                query = query.gte('created_at', filters.dateFrom);
            }

            if (filters.dateTo) {
                query = query.lte('created_at', filters.dateTo);
            }

            // ページネーション
            const limit = filters.limit || 100;
            const offset = filters.offset || 0;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) {
                return {
                    success: false,
                    error: error.message
                };
            }

            const totalPages = Math.ceil((count || 0) / limit);
            const currentPage = Math.floor(offset / limit) + 1;

            return {
                success: true,
                data: data || [],
                pagination: {
                    total: count || 0,
                    page: currentPage,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
            };
        }
    }

    // データ分析結果の取得
    async getAnalytics(filters: ApiFilters = {}): Promise<ApiResponse<DataAnalytics>> {
        try {
            const dataResponse = await this.getAnonymizedData(filters);

            if (!dataResponse.success || !dataResponse.data) {
                return {
                    success: false,
                    error: 'データの取得に失敗しました'
                };
            }

            const data = dataResponse.data;
            const analytics = this.calculateAnalytics(data);

            return {
                success: true,
                data: analytics
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
            };
        }
    }

    // トレンドデータの取得
    async getTrendData(filters: ApiFilters = {}): Promise<ApiResponse<TrendData[]>> {
        try {
            const dataResponse = await this.getAnonymizedData(filters);

            if (!dataResponse.success || !dataResponse.data) {
                return {
                    success: false,
                    error: 'データの取得に失敗しました'
                };
            }

            const trendData = this.calculateTrendData(dataResponse.data);

            return {
                success: true,
                data: trendData
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
            };
        }
    }

    // 年齢分布の取得
    async getAgeDistribution(filters: ApiFilters = {}): Promise<ApiResponse<AgeDistribution[]>> {
        try {
            const dataResponse = await this.getAnonymizedData(filters);

            if (!dataResponse.success || !dataResponse.data) {
                return {
                    success: false,
                    error: 'データの取得に失敗しました'
                };
            }

            const ageDistribution = this.calculateAgeDistribution(dataResponse.data);

            return {
                success: true,
                data: ageDistribution
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
            };
        }
    }

    // カテゴリ別インサイトの取得
    async getCategoryInsights(filters: ApiFilters = {}): Promise<ApiResponse<CategoryInsights[]>> {
        try {
            const dataResponse = await this.getAnonymizedData(filters);

            if (!dataResponse.success || !dataResponse.data) {
                return {
                    success: false,
                    error: 'データの取得に失敗しました'
                };
            }

            const categoryInsights = this.calculateCategoryInsights(dataResponse.data);

            return {
                success: true,
                data: categoryInsights
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '予期しないエラーが発生しました'
            };
        }
    }

    // 分析データの計算
    private calculateAnalytics(data: AnonymizedData[]): DataAnalytics {
        const recordsByCategory: Record<string, number> = {};
        const recordsByAgeGroup: Record<string, number> = {};
        const recordsByGender: Record<string, number> = {};

        data.forEach(record => {
            // カテゴリ別集計
            const dataType = record.data_type;
            recordsByCategory[dataType] = (recordsByCategory[dataType] || 0) + 1;

            // 年齢グループ別集計
            if (record.child_age !== null) {
                const ageGroup = this.getAgeGroup(record.child_age);
                recordsByAgeGroup[ageGroup] = (recordsByAgeGroup[ageGroup] || 0) + 1;
            }

            // 性別集計
            if (record.child_gender) {
                recordsByGender[record.child_gender] = (recordsByGender[record.child_gender] || 0) + 1;
            }
        });

        // 共通パターンの抽出
        const commonPatterns = this.extractCommonPatterns(data);

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
    }

    // トレンドデータの計算
    private calculateTrendData(data: AnonymizedData[]): TrendData[] {
        const trendMap: Record<string, Record<string, number>> = {};

        data.forEach(record => {
            const date = new Date(record.created_at).toISOString().split('T')[0];
            const category = record.data_type;

            if (!trendMap[date]) {
                trendMap[date] = {};
            }

            trendMap[date][category] = (trendMap[date][category] || 0) + 1;
        });

        const trendData: TrendData[] = [];
        Object.entries(trendMap).forEach(([date, categories]) => {
            Object.entries(categories).forEach(([category, count]) => {
                trendData.push({ date, category, count });
            });
        });

        return trendData.sort((a, b) => a.date.localeCompare(b.date));
    }

    // 年齢分布の計算
    private calculateAgeDistribution(data: AnonymizedData[]): AgeDistribution[] {
        const ageGroups: Record<string, number> = {};
        let totalWithAge = 0;

        data.forEach(record => {
            if (record.child_age !== null) {
                const ageGroup = this.getAgeGroup(record.child_age);
                ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
                totalWithAge++;
            }
        });

        return Object.entries(ageGroups).map(([ageGroup, count]) => ({
            ageGroup,
            count,
            percentage: totalWithAge > 0 ? (count / totalWithAge) * 100 : 0
        }));
    }

    // カテゴリ別インサイトの計算
    private calculateCategoryInsights(data: AnonymizedData[]): CategoryInsights[] {
        const categoryData: Record<string, AnonymizedData[]> = {};

        data.forEach(record => {
            const category = record.data_type;
            if (!categoryData[category]) {
                categoryData[category] = [];
            }
            categoryData[category].push(record);
        });

        return Object.entries(categoryData).map(([category, records]) => {
            const uniqueDays = new Set(records.map(record =>
                new Date(record.created_at).toDateString()
            )).size;
            const avgPerDay = uniqueDays > 0 ? records.length / uniqueDays : 0;

            const hourCounts = new Array(24).fill(0);
            records.forEach(record => {
                const hour = new Date(record.created_at).getHours();
                hourCounts[hour]++;
            });

            const maxCount = Math.max(...hourCounts);
            const peakHours = hourCounts
                .map((count, hour) => ({ hour, count }))
                .filter(({ count }) => count === maxCount)
                .map(({ hour }) => hour);

            const commonPatterns = this.extractCommonPatterns(records);

            return {
                category,
                totalCount: records.length,
                avgPerDay,
                peakHours,
                commonPatterns
            };
        });
    }

    // 年齢グループの判定
    private getAgeGroup(age: number): string {
        if (age < 1) return '0歳';
        if (age < 3) return '1-2歳';
        if (age < 6) return '3-5歳';
        if (age < 10) return '6-9歳';
        if (age < 15) return '10-14歳';
        return '15歳以上';
    }

    // 共通パターンの抽出
    private extractCommonPatterns(data: AnonymizedData[]): string[] {
        const patterns: string[] = [];

        // 時間帯パターン
        const hourCounts = new Array(24).fill(0);
        data.forEach(record => {
            const hour = new Date(record.created_at).getHours();
            hourCounts[hour]++;
        });

        const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
        patterns.push(`${maxHour}時台に最も多く記録されています`);

        // 曜日パターン
        const dayOfWeekCounts = new Array(7).fill(0);
        data.forEach(record => {
            const dayOfWeek = new Date(record.created_at).getDay();
            dayOfWeekCounts[dayOfWeek]++;
        });

        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const maxDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
        patterns.push(`${dayNames[maxDay]}曜日に最も多く記録されています`);

        return patterns.slice(0, 3);
    }
}

// シングルトンインスタンス
export const analyticsApi = new AnalyticsApiClient();

// 外部アプリケーション向けのAPIエンドポイント生成
export const generateApiEndpoints = (baseUrl: string) => {
    return {
        // 匿名化データの取得
        getAnonymizedData: `${baseUrl}/api/analytics/data`,

        // データ分析結果の取得
        getAnalytics: `${baseUrl}/api/analytics/summary`,

        // トレンドデータの取得
        getTrendData: `${baseUrl}/api/analytics/trends`,

        // 年齢分布の取得
        getAgeDistribution: `${baseUrl}/api/analytics/age-distribution`,

        // カテゴリ別インサイトの取得
        getCategoryInsights: `${baseUrl}/api/analytics/category-insights`,

        // リアルタイムデータの取得
        getRealTimeData: `${baseUrl}/api/analytics/realtime`,

        // CSV形式でのデータエクスポート
        exportData: `${baseUrl}/api/analytics/export`,

        // データ統計情報の取得
        getStatistics: `${baseUrl}/api/analytics/statistics`
    };
};

// API使用例のドキュメント
export const apiDocumentation = {
    description: 'きょうのできた 匿名化データ分析API',
    version: '1.0.0',
    baseUrl: 'https://your-app-domain.com',
    authentication: 'API Key required',
    endpoints: {
        'GET /api/analytics/data': {
            description: '匿名化された記録データを取得',
            parameters: {
                category: 'データカテゴリ (record, growth_record, calendar_event)',
                dataType: 'データタイプ (achievement, happy, failure, trouble)',
                ageMin: '最小年齢',
                ageMax: '最大年齢',
                gender: '性別 (male, female)',
                dateFrom: '開始日 (ISO 8601)',
                dateTo: '終了日 (ISO 8601)',
                limit: '取得件数 (デフォルト: 100)',
                offset: 'オフセット (デフォルト: 0)'
            },
            response: {
                success: true,
                data: 'AnonymizedData[]',
                pagination: 'PaginationInfo'
            }
        },
        'GET /api/analytics/summary': {
            description: 'データ分析結果のサマリを取得',
            parameters: 'データフィルタリング用パラメータ',
            response: {
                success: true,
                data: 'DataAnalytics'
            }
        },
        'GET /api/analytics/trends': {
            description: 'トレンドデータを取得',
            parameters: 'データフィルタリング用パラメータ',
            response: {
                success: true,
                data: 'TrendData[]'
            }
        }
    },
    rateLimit: '1000 requests per hour',
    examples: {
        curl: `curl -X GET "https://your-app-domain.com/api/analytics/data?category=record&limit=50" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
        javascript: `
const response = await fetch('/api/analytics/data?category=record&limit=50', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`
    }
}; 