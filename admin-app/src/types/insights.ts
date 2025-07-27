export interface ChildInsight {
    childId: string;
    analysisDate: string;
    currentSituation: string;
    concernButtons: ConcernButton[];
}

export interface ConcernButton {
    id: string;
    title: string;
    emoji: string;
    category: 'sleep' | 'food' | 'play' | 'behavior' | 'development';
    priority: number;
}

export interface AIResponse {
    concern: string;
    analysis: string;
    suggestions: string[];
    relatedRecords: string[];
} 