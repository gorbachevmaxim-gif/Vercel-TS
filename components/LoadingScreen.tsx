import * as React from 'react';
import { useState, useEffect } from 'react';
import { LoadingState } from '../types';
import GastrodinamikaLogo from './GastrodinamikaLogo';

interface LoadingScreenProps {
  state: LoadingState;
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state, onComplete }) => {
  // Calculate the raw target percentage based on props
  // Prevent division by zero
  const targetPercent = state.total > 0 ? (state.current / state.total) * 100 : 0;
  
  // Local state for the smooth visual percentage
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      setDisplayPercent(prev => {
        const diff = targetPercent - prev;
        
        // Stop if sufficiently close to target
        if (Math.abs(diff) < 0.5) {
          // If we are close to the target, snap to it
          return targetPercent;
        }

        // Smooth easing: move 10% of the distance per frame
        return prev + diff * 0.1;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPercent]);

  // Handle completion trigger
  useEffect(() => {
    if (displayPercent >= 100 && onComplete) {
        // Add a small delay so the user sees the full circle
        const timer = setTimeout(() => {
            onComplete();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [displayPercent, onComplete]);

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