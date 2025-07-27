// 画像圧縮とリサイズのユーティリティ関数

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
}

/**
 * 画像を圧縮・リサイズする
 */
export const compressImage = (
    file: File,
    options: CompressOptions = {}
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const {
            maxWidth = 800,
            maxHeight = 600,
            quality = 0.8,
            maxSizeKB = 500 // 500KB以下に制限
        } = options;

        // 画像タイプをチェック
        if (!file.type.startsWith('image/')) {
            reject(new Error('画像ファイルを選択してください'));
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // 元の画像サイズを取得
            const { width, height } = img;

            // アスペクト比を維持しながらリサイズ
            let newWidth = width;
            let newHeight = height;

            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;

                if (width > height) {
                    newWidth = Math.min(maxWidth, width);
                    newHeight = newWidth / aspectRatio;
                } else {
                    newHeight = Math.min(maxHeight, height);
                    newWidth = newHeight * aspectRatio;
                }
            }

            // キャンバスのサイズを設定
            canvas.width = newWidth;
            canvas.height = newHeight;

            // 画像を描画
            ctx?.drawImage(img, 0, 0, newWidth, newHeight);

            // 品質を段階的に下げて目標サイズまで圧縮
            let currentQuality = quality;
            let attempts = 0;
            const maxAttempts = 10;

            const tryCompress = () => {
                const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
                const sizeKB = (dataUrl.length * 0.75) / 1024; // Base64のサイズを概算

                if (sizeKB <= maxSizeKB || attempts >= maxAttempts) {
                    resolve(dataUrl);
                } else {
                    currentQuality -= 0.1;
                    attempts++;
                    if (currentQuality > 0.1) {
                        tryCompress();
                    } else {
                        resolve(dataUrl);
                    }
                }
            };

            tryCompress();
        };

        img.onerror = () => {
            reject(new Error('画像の読み込みに失敗しました'));
        };

        // FileReaderを使って画像を読み込み
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

/**
 * LocalStorageの使用量をチェック
 */
export const checkLocalStorageUsage = (): { used: number; total: number; percentage: number } => {
    let used = 0;

    for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length;
        }
    }

    // 一般的なLocalStorageの制限（10MB）
    const total = 10 * 1024 * 1024; // 10MB in bytes
    const percentage = (used / total) * 100;

    return {
        used,
        total,
        percentage
    };
};

/**
 * ファイルサイズを読みやすい形式に変換
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * LocalStorageに安全に保存
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
    try {
        const usage = checkLocalStorageUsage();
        const newDataSize = value.length;

        // 新しいデータを含めて90%を超える場合は警告
        if ((usage.used + newDataSize) / usage.total > 0.9) {
            console.warn('LocalStorage容量が90%を超えています');
            return false;
        }

        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.error('LocalStorage保存エラー:', error);
        return false;
    }
}; 