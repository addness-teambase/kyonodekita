import React from 'react';
import { Home, MessageCircle, Edit, Calendar, BarChart2 } from 'lucide-react';

interface BottomNavigationBarProps {
    activeTab: 'home' | 'chat' | 'record' | 'calendar' | 'graph';
    onTabChange: (tab: 'home' | 'chat' | 'record' | 'calendar' | 'graph') => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
    activeTab,
    onTabChange
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-40">
            <button
                onClick={() => onTabChange('home')}
                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'home' ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <Home size={20} />
                <span className="text-xs mt-1">ホーム</span>
            </button>

            <button
                onClick={() => onTabChange('record')}
                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'record' ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <Edit size={20} />
                <span className="text-xs mt-1">記録</span>
            </button>

            <button
                onClick={() => onTabChange('calendar')}
                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'calendar' ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <Calendar size={20} />
                <span className="text-xs mt-1">カレンダー</span>
            </button>

            <button
                onClick={() => onTabChange('graph')}
                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'graph' ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <BarChart2 size={20} />
                <span className="text-xs mt-1">グラフ</span>
            </button>

            <button
                onClick={() => onTabChange('chat')}
                className={`flex flex-col items-center justify-center w-full h-full ${activeTab === 'chat' ? 'text-orange-500' : 'text-gray-500'
                    }`}
            >
                <MessageCircle size={20} />
                <span className="text-xs mt-1">チャット</span>
            </button>
        </div>
    );
};

export default BottomNavigationBar; 