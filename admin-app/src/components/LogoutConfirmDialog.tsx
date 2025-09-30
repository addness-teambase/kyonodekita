import React from 'react';
import { Dialog } from '@headlessui/react';
import { LogOut } from 'lucide-react';

interface LogoutConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                            <LogOut className="h-8 w-8 text-blue-500" />
                        </div>

                        <Dialog.Title className="text-lg font-bold text-gray-800 mb-2">
                            ログアウトしますか？
                        </Dialog.Title>

                        <p className="text-sm text-gray-600 mb-6">
                            ログアウトすると、再度ログインが必要になります
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="flex-1 px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors focus:outline-none"
                                onClick={onClose}
                            >
                                キャンセル
                            </button>

                            <button
                                type="button"
                                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all rounded-xl shadow-sm focus:outline-none"
                                onClick={onConfirm}
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default LogoutConfirmDialog;