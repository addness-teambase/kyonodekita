import React from 'react';

interface StressAnimationProps {
  isAnimating: boolean;
}

const StressAnimation: React.FC<StressAnimationProps> = ({ isAnimating }) => {
  if (!isAnimating) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Ripple Effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200px] h-[200px] rounded-full bg-blue-400 opacity-50 animate-ping" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-300 opacity-30 animate-ping animation-delay-100" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-200 opacity-20 animate-ping animation-delay-200" />
      </div>
      
      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-blue-400 opacity-70"
            style={{
              width: `${Math.random() * 20 + 5}px`,
              height: `${Math.random() * 20 + 5}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-up ${Math.random() * 1 + 1}s ease-out forwards`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StressAnimation;