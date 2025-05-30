import React from 'react';
import { Heart, Calendar, BarChart, MessageCircle, Smile, LineChart, BookOpen, Star, Trash2, Paintbrush as PaintBrush, Download, Database } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'ストレス記録',
    description: 'その日のストレスレベル（軽い、普通、強い）と、原因を記録できます。'
  },
  {
    icon: Smile,
    title: '良かったこと記録',
    description: 'その日にあった良かったこと（小さなこと、普通のこと、大きなこと）を記録できます。'
  },
  {
    icon: BarChart,
    title: 'ストレス分析',
    description: '記録されたストレスレベルを基に、健康状態を分析し、アドバイスを提供します。'
  },
  {
    icon: LineChart,
    title: 'グラフ表示',
    description: 'ストレスや良かったことの記録をグラフで表示し、日々の変化を確認できます。'
  },
  {
    icon: Calendar,
    title: 'カレンダー表示',
    description: 'カレンダー形式で過去の記録を振り返ることができます。'
  },
  {
    icon: BookOpen,
    title: '日記生成',
    description: '過去の記録を基に、AIが自動で日記を生成します。'
  },
  {
    icon: MessageCircle,
    title: '励まし/褒め',
    description: '過去の記録を基に、AIがあなたを励ましたり、褒めたりします。'
  },
  {
    icon: Star,
    title: 'LINE連携（開発中）',
    description: 'LINEアカウントでログインできるようになります。'
  },
  {
    icon: Database,
    title: 'データベース',
    description: '記録されたデータは安全な場所に保存されます。'
  },
  {
    icon: Trash2,
    title: '記録の削除',
    description: '過去の記録を削除できます。'
  },
  {
    icon: PaintBrush,
    title: 'テーマ',
    description: 'アプリのデザインテーマを変更できます。'
  },
  {
    icon: Download,
    title: 'PWA対応',
    description: 'インストールして、オフラインでも使用できます。'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-blue-800 mb-4">アプリの機能</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-blue-100">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-blue-900">{feature.title}</h3>
              </div>
              <p className="text-sm text-gray-600 ml-11">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturesSection;