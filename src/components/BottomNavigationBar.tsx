import React from 'react';
import { Home, UserCheck, Edit, Calendar, TrendingUp } from 'lucide-react';

interface BottomNavigationBarProps {
    activeTab: 'home' | 'chat' | 'record' | 'calendar' | 'growth';
    onTabChange: (tab: 'home' | 'chat' | 'record' | 'calendar' | 'growth') => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
    activeTab,
    onTabChange
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex justify-around items-center h-20 px-4 z-40 shadow-lg">
            <button
                onClick={() => onTabChange('home')}
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === 'home'
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${activeTab === 'home'
                    ? 'bg-pink-100'
                    : 'hover:bg-gray-50'
                    }`}>
                    <Home size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">ホーム</span>
            </button>

            <button
                onClick={() => onTabChange('record')}
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === 'record'
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${activeTab === 'record'
                    ? 'bg-pink-100'
                    : 'hover:bg-gray-50'
                    }`}>
                    <Edit size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">記録</span>
            </button>

            <button
                onClick={() => onTabChange('calendar')}
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === 'calendar'
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${activeTab === 'calendar'
                    ? 'bg-pink-100'
                    : 'hover:bg-gray-50'
                    }`}>
                    <Calendar size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">カレンダー</span>
            </button>

            <button
                onClick={() => onTabChange('growth')}
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === 'growth'
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${activeTab === 'growth'
                    ? 'bg-pink-100'
                    : 'hover:bg-gray-50'
                    }`}>
                    <TrendingUp size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">成長</span>
            </button>

            <button
                onClick={() => onTabChange('chat')}
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === 'chat'
                    ? 'text-pink-500'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${activeTab === 'chat'
                    ? 'bg-pink-100'
                    : 'hover:bg-gray-50'
                    }`}>
                    <UserCheck size={20} />
                </div>
                <span className="text-xs mt-1 font-medium">相談</span>
            </button>
        </div>
    );
};

export default BottomNavigationBar; 