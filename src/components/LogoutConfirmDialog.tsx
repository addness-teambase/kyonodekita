import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { LogOut, X } from 'lucide-react';

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
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                                <div className="absolute top-4 right-4">
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-center mb-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10">
                                        <LogOut className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>

                                <Dialog.Title
                                    as="h3"
                                    className="text-xl font-semibold leading-6 text-center text-gray-900"
                                >
                                    ログアウトの確認
                                </Dialog.Title>
                                <div className="mt-3">
                                    <p className="text-base text-center text-gray-600">
                                        本当にログアウトしますか？
                                    </p>
                                    <p className="text-sm text-center text-gray-500 mt-1">
                                        ログアウトすると再度ログインが必要になります
                                    </p>
                                </div>

                                <div className="mt-6 flex justify-center gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={onClose}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
                                        onClick={onConfirm}
                                    >
                                        <LogOut size={16} />
                                        ログアウト
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default LogoutConfirmDialog; 