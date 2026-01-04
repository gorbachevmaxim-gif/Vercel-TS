import * as React from 'react';
import { CityAnalysisResult } from '../types';

interface SummaryViewProps {
  data: CityAnalysisResult[];
  title: string;
  dateLabel: string;
  isSecondWeekend?: boolean;
  onCityClick: (city: string) => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ data, title, dateLabel, isSecondWeekend = false, onCityClick }) => {
  // Filter logic: City must be DRY AND have a valid ROUTE for that wind direction
  const getDryWithRoute = (city: CityAnalysisResult) => {
    const w = isSecondWeekend ? city.weekend2 : city.weekend1;
    const sat = (w.saturday?.isDry && w.saturday?.hasRoute) ?? false;
    const sun = (w.sunday?.isDry && w.sunday?.hasRoute) ?? false;
    return { sat, sun, name: city.cityName };
  };

  const processed = data.map(getDryWithRoute);
  const fullWeekend = processed.filter(x => x.sat && x.sun).map(x => x.name);
  const onlySat = processed.filter(x => x.sat && !x.sun).map(x => x.name);
  const onlySun = processed.filter(x => !x.sat && x.sun).map(x => x.name);

  // Sun ranking logic (active hours 09-18) - Also checking route availability for ranking
  const getSun = (city: CityAnalysisResult, day: 'saturday' | 'sunday') => {
    const w = isSecondWeekend ? city.weekend2 : city.weekend1;
    const d = w[day];
    // Only show in sun ranking if it has a route
    if (!d || !d.hasRoute) return { name: city.cityName, val: 0, str: '0' };
    return { name: city.cityName, val: d.sunSeconds, str: d.sunStr };
  };

  const topSat = data
    .map(c => getSun(c, 'saturday'))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5)
    .filter(x => x.val > 0);

  const topSun = data
    .map(c => getSun(c, 'sunday'))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5)
    .filter(x => x.val > 0);

  return (
    <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 border-b pb-2">
        {title}, <span className="font-normal text-sm text-slate-500">{dateLabel}</span>
      </h3>
      
      {/* Dry Cities Rows - Changed to always be single column (rows) */}
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg bg-green-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">Здесь без осадков весь уикенд</div>
          {fullWeekend.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {fullWeekend.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c)}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:text-blue-600 hover:shadow-md active:scale-95 transition-all touch-manipulation"
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Нет городов</span>}
        </div>

        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Здесь без осадков только в субботу</div>
          {onlySat.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySat.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c)}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:text-blue-600 hover:shadow-md active:scale-95 transition-all touch-manipulation"
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Пусто</span>}
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">Здесь без осадков только в воскресенье</div>
          {onlySun.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySun.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c)}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:text-blue-600 hover:shadow-md active:scale-95 transition-all touch-manipulation"
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Пусто</span>}
        </div>
      </div>

      {/* Sun Ranking - Horizontal Scroll on Mobile with fixed label */}
      <div className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">☀️ Самые солнечные (09:00 - 18:00)</div>
        
        <div className="space-y-3">
            {/* Saturday Row */}
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-bold text-slate-400 w-8">Сб:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                    {topSat.length ? topSat.map((item, i) => (
                        <button 
                            key={i} 
                            onClick={() => onCityClick(item.name)}
                            className="shrink-0 flex items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all touch-manipulation"
                        >
                            <span className="text-sm font-medium text-slate-800 mr-1">{item.name}</span>
                            <span className="text-xs text-amber-600 font-bold">{item.str}</span>
                        </button>
                    )) : <span className="text-sm text-slate-400 pt-1">Нет солнца</span>}
                </div>
            </div>

            {/* Sunday Row */}
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-bold text-slate-400 w-8">Вс:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                    {topSun.length ? topSun.map((item, i) => (
                        <button 
                            key={i} 
                            onClick={() => onCityClick(item.name)}
                            className="shrink-0 flex items-center bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all touch-manipulation"
                        >
                            <span className="text-sm font-medium text-slate-800 mr-1">{item.name}</span>
                            <span className="text-xs text-amber-600 font-bold">{item.str}</span>
                        </button>
                    )) : <span className="text-sm text-slate-400 pt-1">Нет солнца</span>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;