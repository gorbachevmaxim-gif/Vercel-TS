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
  // Filter logic: City must be DRY AND have a ROUTE.
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

  // Sun ranking logic (active hours 09-18) - Only consider cities with routes
  const getSun = (city: CityAnalysisResult, day: 'saturday' | 'sunday') => {
    const w = isSecondWeekend ? city.weekend2 : city.weekend1;
    const d = w[day];
    // Strict check: must have route to be ranked
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

  const renderSection = (cities: string[], label: string, icon: string, bgColor: string, badgeColor: string) => {
      if (cities.length === 0) return null;
      
      return (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-komoot transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{icon}</span>
                  <h3 className="font-bold text-lg text-slate-800">{label}</h3>
                  <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      {cities.length}
                  </span>
              </div>
              <div className="flex flex-wrap gap-2">
                  {cities.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border bg-slate-50 border-slate-100 text-slate-700 hover:border-komoot-green hover:text-komoot-green active:scale-95`}
                     >
                        {c}
                     </button>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
         <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
             {dateLabel}
         </span>
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fullWeekend.length === 0 && onlySat.length === 0 && onlySun.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <span className="text-4xl block mb-2">🌧</span>
                  <p className="text-slate-500 font-medium">Похоже, в эти выходные везде дожди...</p>
              </div>
          ) : (
              <>
                {renderSection(fullWeekend, "Весь уикенд", "🔥", "bg-green-50", "text-green-700")}
                {renderSection(onlySat, "Только суббота", "📅", "bg-blue-50", "text-blue-700")}
                {renderSection(onlySun, "Только воскресенье", "📅", "bg-indigo-50", "text-indigo-700")}
              </>
          )}
      </div>

      {/* Sun Ranking - Horizontal Scroll */}
      {(topSat.length > 0 || topSun.length > 0) && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>☀️</span> Лидеры по солнцу (09:00 - 18:00)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Saturday */}
                {topSat.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Суббота</h4>
                        <div className="space-y-2">
                            {topSat.map((item, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => onCityClick(item.name)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-amber-800">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded group-hover:bg-white">
                                        {item.str}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sunday */}
                {topSun.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Воскресенье</h4>
                        <div className="space-y-2">
                            {topSun.map((item, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => onCityClick(item.name)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-50 group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-amber-800">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded group-hover:bg-white">
                                        {item.str}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};

export default SummaryView;