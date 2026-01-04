import * as React from 'react';
import { useState, useEffect } from 'react';
import { LoadingState } from '../types';
import GastrodinamikaLogo from './GastrodinamikaLogo';

interface LoadingScreenProps {
  state: LoadingState;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state }) => {
  // Calculate the raw target percentage based on props
  const targetPercent = state.total > 0 ? (state.current / state.total) * 100 : 0;
  
  // Local state for the smooth visual percentage
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setDisplayPercent(prev => {
        const diff = targetPercent - prev;
        
        // Stop if sufficiently close to target
        if (Math.abs(diff) < 0.1) {
          return targetPercent;
        }

        // Smooth easing: move 10% of the distance per frame
        // This creates a nice deceleration effect and smooth transition between batches
        return prev + diff * 0.1;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount or when targetPercent changes (restart loop with new target)
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPercent]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        
        {/* Logo Container */}
        <div className="w-44 h-44 flex items-center justify-center relative">
            <GastrodinamikaLogo 
                percent={displayPercent} 
                className="w-full h-full" 
            />
        </div>
        
        <div className="w-full flex flex-col items-center space-y-3">
            {/* Percentage */}
            <span className="text-sm font-bold text-slate-900 font-mono">
                {Math.round(displayPercent)}%
            </span>
            
            {/* Status Text */}
            <p className="text-xs text-slate-400 font-medium h-4">
                {state.status}
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;