import React, { useState } from 'react';
import { Award, Smile, X, AlertTriangle } from 'lucide-react';
import { useRecord, RecordCategory } from '../context/RecordContext';
import RecordAnimation from './RecordAnimation';
import { Dialog } from '@headlessui/react';

interface RecordButtonProps {
    onSubmit?: (content: string) => void;
}

const CategoryIcons: Record<RecordCategory, React.ElementType> = {
    achievement: Award,
    happy: Smile,
    failure: X,
    trouble: AlertTriangle
};

const RecordButton: React.FC<RecordButtonProps> = ({ onSubmit }) => {
    const {
        addRecordEvent,
        isAnimating,
        activeCategory,
        getCategoryName
    } = useRecord();

    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!note.trim()) {
            setError('内容を入力してください');
            return;
        }

        addRecordEvent(activeCategory, note);

        // App.tsxから渡された関数を使って記録を追加
        if (onSubmit) {
            onSubmit(note);
        }

        setIsOpen(false);
        setNote('');
        setError('');
    };

    const Icon = CategoryIcons[activeCategory];
    const categoryName = getCategoryName(activeCategory);

    return (
        <div className="relative">
            <RecordAnimation isAnimating={isAnimating} />

            <button
                onClick={() => setIsOpen(true)}
                className="w-40 h-40 rounded-full bg-gradient-to-r from-orange-600 to-orange-400
                  text-white flex flex-col items-center justify-center shadow-xl 
                  transition-all duration-150 hover:scale-105 active:scale-90 active:shadow-inner
                  focus:outline-none focus:ring-4 focus:ring-white/30"
                aria-label={`${categoryName}を記録`}
            >
                <Icon className="w-10 h-10 mb-3" />
                <span className="text-lg font-medium">記録する</span>
            </button>

            <Dialog
                open={isOpen}
                onClose={() => {
                    setIsOpen(false);
                    setError('');
                }}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
                        <Dialog.Title className="text-2xl font-semibold text-gray-900 mb-6">
                            {categoryName}を記録
                        </Dialog.Title>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-3">
                                    内容
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => {
                                        setNote(e.target.value);
                                        if (e.target.value.trim()) setError('');
                                    }}
                                    placeholder={`${categoryName}の内容を記録してください`}
                                    className={`w-full p-4 border rounded-xl text-base focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${error ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    rows={5}
                                />
                                {error && <p className="mt-2 text-base text-red-500">{error}</p>}
                            </div>

                            <div className="flex gap-4 pt-3">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setError('');
                                    }}
                                    className="flex-1 py-4 px-6 border border-gray-300 rounded-xl text-base font-medium hover:bg-gray-50 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl text-base font-medium hover:from-orange-700 hover:to-orange-600 shadow-md transition-all active:scale-95"
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

export default RecordButton; 