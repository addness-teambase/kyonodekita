import React, { useState } from 'react';
import { Brain, Smile } from 'lucide-react';
import { useStress } from '../context/StressContext';
import StressAnimation from './StressAnimation';
import { Dialog } from '@headlessui/react';

const ObservationButton: React.FC = () => {
  const {
    addStressEvent,
    addGoodThingEvent,
    isAnimating,
    recordMode
  } = useStress();

  const [isOpen, setIsOpen] = useState(false);
  const [level, setLevel] = useState<'high' | 'medium' | 'low' | 'big' | 'medium' | 'small'>('medium');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError('内容を入力してください');
      return;
    }

    if (recordMode === 'stress') {
      addStressEvent(level as 'high' | 'medium' | 'low', note);
    } else {
      addGoodThingEvent(level as 'big' | 'medium' | 'small', note);
    }

    setIsOpen(false);
    setNote('');
    setLevel('medium');
    setError('');
  };

  const Icon = recordMode === 'stress' ? Brain : Smile;
  const levelOptions = recordMode === 'stress'
    ? [
      { value: 'high', label: '強い' },
      { value: 'medium', label: '普通' },
      { value: 'low', label: '軽い' }
    ]
    : [
      { value: 'big', label: '大きな' },
      { value: 'medium', label: '普通の' },
      { value: 'small', label: '小さな' }
    ];

  return (
    <div className="relative w-full flex flex-col items-center justify-center gap-6">
      <StressAnimation isAnimating={isAnimating} />

      <button
        onClick={() => setIsOpen(true)}
        className="relative z-10 w-32 h-32 rounded-full bg-blue-500
                  text-white flex flex-col items-center justify-center shadow-lg transform 
                  transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-md
                  focus:outline-none focus:ring-4 focus:ring-white/30"
        aria-label={recordMode === 'stress' ? '不安に思ったことを記録' : '良かったことを記録'}
      >
        <Icon className="w-8 h-8 mb-2" />
        <span className="text-base">記録する</span>
      </button>

      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError('');
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {recordMode === 'stress' ? '不安に思ったことを記録' : '良かったことを記録'}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  レベル
                </label>
                <div className="flex gap-2">
                  {levelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLevel(option.value as typeof level)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm transition-all ${level === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容
                </label>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (e.target.value.trim()) setError('');
                  }}
                  placeholder={recordMode === 'stress'
                    ? '不安に思ったことの内容を記録してください'
                    : '良かったことの内容を記録してください'}
                  className={`w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
                  rows={4}
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setError('');
                  }}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600"
                >
                  記録する
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ObservationButton;