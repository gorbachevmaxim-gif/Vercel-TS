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
        {/* Changed from w-64 h-64 to w-44 h-44 to reduce size by ~30% */}
        <div className="w-44 h-44 flex items-center justify-center relative">
            <GastrodinamikaLogo 
                percent={percentage} 
                className="w-full h-full" 
            />
        </div>
        
        <div className="w-full flex flex-col items-center space-y-3">
            {/* Percentage */}
            <span className="text-sm font-bold text-slate-900 font-mono">
                {percentage}%
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