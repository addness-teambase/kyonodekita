import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface BirthdayEffectProps {
    childName: string;
}

const BirthdayEffect: React.FC<BirthdayEffectProps> = ({ childName }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // キラキラエフェクト（紙吹雪）を表示
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // 星や風船のような紙吹雪を左右から発射
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'],
                shapes: ['circle', 'square'],
            });

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#ff0000', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'],
                shapes: ['circle', 'square'],
            });
        }, 250);

        // 5秒後に表示を消す
        const timer = setTimeout(() => {
            setVisible(false);
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 shadow-lg rounded-xl p-4 text-center">
                <p className="text-base text-gray-700">
                    今日は<span className="font-bold text-orange-500">{childName}</span>ちゃんの誕生日です。おめでとうございます。
                </p>
            </div>
        </div>
    );
};

export default BirthdayEffect; 