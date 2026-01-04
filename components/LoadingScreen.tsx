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
      <div className="w-full max-w-xs flex flex-col items-center space-y-8">
        
        {/* Logo Container with Centered Text */}
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Spinning Logo */}
            <div className="absolute inset-0 animate-[spin_6s_linear_infinite]">
                <GastrodinamikaLogo className="w-full h-full text-slate-800" />
            </div>
            
            {/* Centered Percentage */}
            <div className="z-10 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm rounded-full w-12 h-12 shadow-sm border border-slate-100">
                <span className="text-sm font-bold text-slate-900 font-mono">
                    {percentage}%
                </span>
            </div>
        </div>
        
        <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest">Gastrodinamika</h2>
            <p className="text-xs text-slate-500 animate-pulse font-medium">{state.status}</p>
        </div>

        {/* Minimalist Progress bar */}
        <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
          <div 
            className="h-full bg-slate-800 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;