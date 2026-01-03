import React from 'react';
import { CityAnalysisResult } from '../types';

interface SummaryViewProps {
  data: CityAnalysisResult[];
  weekendLabel: string;
  isSecondWeekend?: boolean;
}

const SummaryView: React.FC<SummaryViewProps> = ({ data, weekendLabel, isSecondWeekend = false }) => {
  // Filter logic
  const getDry = (city: CityAnalysisResult) => {
    const w = isSecondWeekend ? city.weekend2 : city.weekend1;
    const sat = w.saturday?.isDry ?? false;
    const sun = w.sunday?.isDry ?? false;
    return { sat, sun, name: city.cityName };
  };

  const processed = data.map(getDry);
  const fullWeekend = processed.filter(x => x.sat && x.sun).map(x => x.name);
  const onlySat = processed.filter(x => x.sat && !x.sun).map(x => x.name);
  const onlySun = processed.filter(x => !x.sat && x.sun).map(x => x.name);

  // Sun ranking logic (active hours 09-18)
  const getSun = (city: CityAnalysisResult, day: 'saturday' | 'sunday') => {
    const w = isSecondWeekend ? city.weekend2 : city.weekend1;
    const d = w[day];
    return { name: city.cityName, val: d?.sunSeconds || 0, str: d?.sunStr || '0' };
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
      <h3 className="text-lg font-bold text-slate-800 border-b pb-2">{weekendLabel}</h3>
      
      {/* Dry Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-green-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-2">Весь уикенд</div>
          {fullWeekend.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {fullWeekend.map(c => <span key={c} className="px-2 py-1 bg-white rounded shadow-sm text-sm font-medium text-slate-700">{c}</span>)}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Нет городов</span>}
        </div>

        <div className="rounded-lg bg-blue-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Только Суббота</div>
          {onlySat.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySat.map(c => <span key={c} className="px-2 py-1 bg-white rounded shadow-sm text-sm font-medium text-slate-700">{c}</span>)}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Пусто</span>}
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">Только Воскресенье</div>
          {onlySun.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySun.map(c => <span key={c} className="px-2 py-1 bg-white rounded shadow-sm text-sm font-medium text-slate-700">{c}</span>)}
             </div>
          ) : <span className="text-sm text-slate-400 italic">Пусто</span>}
        </div>
      </div>

      {/* Sun Ranking - Horizontal Scroll on Mobile */}
      <div className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-3">☀️ Самые солнечные (09:00 - 18:00)</div>
        
        <div className="space-y-3">
            <div className="flex items-start gap-2 overflow-x-auto no-scrollbar pb-1">
                <span className="shrink-0 text-sm font-bold text-slate-400 w-8">Сб:</span>
                {topSat.length ? topSat.map((item, i) => (
                    <div key={i} className="shrink-0 flex items-center bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        <span className="text-sm font-medium text-slate-800 mr-1">{item.name}</span>
                        <span className="text-xs text-amber-600 font-bold">{item.str}</span>
                    </div>
                )) : <span className="text-sm text-slate-400">Нет солнца</span>}
            </div>
            <div className="flex items-start gap-2 overflow-x-auto no-scrollbar pb-1">
                <span className="shrink-0 text-sm font-bold text-slate-400 w-8">Вс:</span>
                {topSun.length ? topSun.map((item, i) => (
                    <div key={i} className="shrink-0 flex items-center bg-amber-50 px-2 py-1 rounded border border-amber-100">
                        <span className="text-sm font-medium text-slate-800 mr-1">{item.name}</span>
                        <span className="text-xs text-amber-600 font-bold">{item.str}</span>
                    </div>
                )) : <span className="text-sm text-slate-400">Нет солнца</span>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;