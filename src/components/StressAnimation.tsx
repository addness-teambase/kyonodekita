import React from 'react';

interface StressAnimationProps {
  isAnimating: boolean;
}

const StressAnimation: React.FC<StressAnimationProps> = ({ isAnimating }) => {
  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* シンプルな円のアニメーション */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200px] h-[200px] rounded-full bg-blue-400/50 animate-ping" />
      </div>
    </div>
  );
};

export default StressAnimation;