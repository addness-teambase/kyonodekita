import React from 'react';
import { UserCircle, ChevronLeft, DollarSign, MessageCircle, Video } from 'lucide-react';

interface Expert {
  id: string;
  name: string;
  profile_image_url: string | null;
  self_introduction: string;
  description: string;
  consultation_fee: number;
  timerex_url: string;
}

interface ExpertDetailProps {
  expert: Expert;
  onBack: () => void;
  onConsult: (expert: Expert) => void;
}

const ExpertDetail: React.FC<ExpertDetailProps> = ({ expert, onBack, onConsult }) => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4 pb-48">
          {/* 戻るボタン */}
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">戻る</span>
          </button>

          {/* プロフィール写真と名前 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center mb-6">
              {expert.profile_image_url ? (
                <img
                  src={expert.profile_image_url}
                  alt={expert.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-pink-100 mb-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center border-4 border-pink-200 mb-4">
                  <UserCircle className="w-12 h-12 text-pink-500" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{expert.name}</h1>
              <div className="flex items-center text-pink-600">
                <DollarSign className="w-5 h-5 mr-1" />
                <span className="text-xl font-semibold">
                  {expert.consultation_fee.toLocaleString()}円
                </span>
              </div>
            </div>
          </div>

          {/* 自己紹介文 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-pink-500" />
              自己紹介
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {expert.self_introduction}
            </p>
          </div>

          {/* 紹介文 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Video className="w-5 h-5 mr-2 text-pink-500" />
              相談について
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {expert.description}
            </p>
          </div>
        </div>
      </div>

      {/* 相談するボタン（固定） */}
      <div className="fixed bottom-24 left-0 right-0 px-4 pb-4 pt-3 bg-white border-t border-gray-100 z-30 shadow-2xl">
        <button
          onClick={() => onConsult(expert)}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          相談する
        </button>
      </div>
    </div>
  );
};

export default ExpertDetail;

