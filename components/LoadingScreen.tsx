import * as React from 'react';
import { LoadingState } from '../types';
import GastrodinamikaLogo from './GastrodinamikaLogo';

interface LoadingScreenProps {
  state: LoadingState;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state }) => {
  const percentage = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xs flex flex-col items-center space-y-6">
        
        {/* Logo Container */}
        <div className="w-48 h-48 flex items-center justify-center">
             {/* Pass current percentage to logo to animate filling */}
            <GastrodinamikaLogo 
                percent={percentage} 
                className="w-full h-full text-slate-900" 
            />
        </div>
        
        <div className="w-full flex flex-col items-center space-y-2">
            {/* Minimalist Progress bar */}
            <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-200">
              <div 
                className="h-full bg-slate-900 transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Percentage */}
            <span className="text-sm font-bold text-slate-900 font-mono">
                {percentage}%
            </span>
            
            {/* Status Text */}
            <p className="text-xs text-slate-400 font-medium animate-pulse h-4">
                {state.status}
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;