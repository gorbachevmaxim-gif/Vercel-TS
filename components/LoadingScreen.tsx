import React from 'react';
import { LoadingState } from '../types';

interface LoadingScreenProps {
  state: LoadingState;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ state }) => {
  const percentage = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="relative mx-auto h-24 w-24">
            <svg className="animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
                {percentage}%
            </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800">Анализ погоды</h2>
        <p className="text-sm text-slate-500 animate-pulse">{state.status}</p>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;