import { useSummaryFiltering } from '../hooks/useSummaryFiltering';
import * as React from 'react';
import { CityAnalysisResult } from '../types';

interface SummaryViewProps {
  data: CityAnalysisResult[];
  title: string;
  dateLabel: string;
  isSecondWeekend?: boolean;
  onCityClick: (city: string, day: 'saturday' | 'sunday') => void;
  overrideSundayClick?: (city: string) => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ data, title, dateLabel, isSecondWeekend = false, onCityClick, overrideSundayClick }) => {
  const filteredData = useSummaryFiltering({ data, isSecondWeekend });
  const weekendType = isSecondWeekend ? 'weekend2' : 'weekend1';

  const citiesDryAllWeekend = React.useMemo(() => {
    return filteredData
      .filter(city => {
        const satStats = city[weekendType]?.saturday;
        const sunStats = city[weekendType]?.sunday;
        return (satStats?.isDry && satStats?.isMorningRideSuitable && satStats?.hasRoute) &&
               (sunStats?.isDry && sunStats?.isMorningRideSuitable && sunStats?.hasRoute);
      })
      .map(city => city.cityName);
  }, [filteredData, weekendType]);

  const onlySat = React.useMemo(() => {
    return filteredData
      .filter(city => {
        const satStats = city[weekendType]?.saturday;
        const sunStats = city[weekendType]?.sunday;
        return (satStats?.isDry && satStats?.isMorningRideSuitable && satStats?.hasRoute) &&
               !(sunStats?.isDry && sunStats?.isMorningRideSuitable && sunStats?.hasRoute);
      })
      .map(city => city.cityName);
  }, [filteredData, weekendType]);

  const onlySun = React.useMemo(() => {
    return filteredData
      .filter(city => {
        const satStats = city[weekendType]?.saturday;
        const sunStats = city[weekendType]?.sunday;
        return !(satStats?.isDry && satStats?.isMorningRideSuitable && satStats?.hasRoute) &&
               (sunStats?.isDry && sunStats?.isMorningRideSuitable && sunStats?.hasRoute);
      })
      .map(city => city.cityName);
  }, [filteredData, weekendType]);

  const topSat = React.useMemo(() => {
    return filteredData
      .filter(city => city[weekendType]?.saturday?.sunSeconds !== undefined && city[weekendType]?.saturday?.sunSeconds > 0)
      .sort((a, b) => (b[weekendType]?.saturday?.sunSeconds || 0) - (a[weekendType]?.saturday?.sunSeconds || 0))
      .slice(0, 5) // Top 5
      .map(city => ({
        name: city.cityName,
        str: city[weekendType]?.saturday?.sunStr || ''
      }));
  }, [filteredData, weekendType]);

  const topSun = React.useMemo(() => {
    return filteredData
      .filter(city => city[weekendType]?.sunday?.sunSeconds !== undefined && city[weekendType]?.sunday?.sunSeconds > 0)
      .sort((a, b) => (b[weekendType]?.sunday?.sunSeconds || 0) - (a[weekendType]?.sunday?.sunSeconds || 0))
      .slice(0, 5) // Top 5
      .map(city => ({
        name: city.cityName,
        str: city[weekendType]?.sunday?.sunStr || ''
      }));
  }, [filteredData, weekendType]);



  return (
    <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <h3 className="sticky-header text-lg font-bold text-slate-800 border-b pb-2">
        {title}, <span className="font-normal text-sm text-[#404823]">{dateLabel}</span>
      </h3>
      
      {/* Dry Cities Rows */}
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-lg p-3 bg-[#edebe5]">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-black">Здесь без осадков весь уикенд</div>
          {citiesDryAllWeekend.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {citiesDryAllWeekend.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c, 'saturday')}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:shadow-md active:scale-95 transition-all touch-manipulation border"
                        style={{ color: '#000000', borderColor: '#ffffff' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4f6814';
                          e.currentTarget.style.borderColor = '#4f6814';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#000000';
                          e.currentTarget.style.borderColor = '#ffffff';
                        }}
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm italic" style={{ color: '#404823' }}>Нет городов</span>}
        </div>

        <div className="rounded-lg p-3 bg-[#edebe5]">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-black">Здесь без осадков только в субботу</div>
          {onlySat.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySat.map(c => (
                     <button 
                        key={c} 
                        onClick={() => onCityClick(c, 'saturday')}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:shadow-md active:scale-95 transition-all touch-manipulation border"
                        style={{ color: '#000000', borderColor: '#ffffff' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4f6814';
                          e.currentTarget.style.borderColor = '#4f6814';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#000000';
                          e.currentTarget.style.borderColor = '#ffffff';
                        }}
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm italic text-[#404823]">Нет городов</span>}
        </div>

        <div className="rounded-lg p-3 bg-[#edebe5]">
          <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-black">Здесь без осадков только в воскресенье</div>
          {onlySun.length > 0 ? (
             <div className="flex flex-wrap gap-2">
                 {onlySun.map(c => (
                     <button 
                        key={c} 
                        onClick={() => overrideSundayClick ? overrideSundayClick(c) : onCityClick(c, 'sunday')}
                        className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:shadow-md active:scale-95 transition-all touch-manipulation border"
                        style={{ color: '#000000', borderColor: '#ffffff' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#4f6814';
                          e.currentTarget.style.borderColor = '#4f6814';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#000000';
                          e.currentTarget.style.borderColor = '#ffffff';
                        }}
                     >
                        {c}
                     </button>
                 ))}
             </div>
          ) : <span className="text-sm italic text-[#404823]">Нет городов</span>}
        </div>
      </div>

      {/* Sun Ranking */}
      <div className="pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-black">Самые солнечные (09:00 - 18:00)</div>
        
        <div className="space-y-3">
            {/* Saturday Row */}
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-bold w-8 text-[#404823]">Сб:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                    {topSat.length ? topSat.map((item, i) => (
                        <button 
                            key={i} 
                            onClick={() => onCityClick(item.name, 'saturday')}
                            className="shrink-0 flex items-center px-3 py-1.5 rounded-lg border active:scale-95 transition-all touch-manipulation shadow-sm hover:shadow-md"
                            style={{ backgroundColor: '#edebe5', borderColor: '#edebe5', color: '#000000' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#edebe5';
                              e.currentTarget.style.borderColor = '#ee6b17';
                              e.currentTarget.style.color = '#000000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#edebe5';
                              e.currentTarget.style.borderColor = '#edebe5';
                              e.currentTarget.style.color = '#000000';
                            }}
                        >
                            <span className="text-sm font-medium mr-1">{item.name}</span>
                            <span className="text-xs font-bold text-[#ee6b17]">{item.str}</span>
                        </button>
                    )) : <span className="text-sm pt-1 text-[#404823]">Нет солнца</span>}
                </div>
            </div>

            {/* Sunday Row */}
            <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-bold w-8 text-[#404823]">Вс:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
                    {topSun.length ? topSun.map((item, i) => (
                        <button 
                            key={i} 
                            onClick={() => overrideSundayClick ? overrideSundayClick(item.name) : onCityClick(item.name, 'sunday')}
                            className="shrink-0 flex items-center px-3 py-1.5 rounded-lg border active:scale-95 transition-all touch-manipulation shadow-sm hover:shadow-md"
                            style={{ backgroundColor: '#edebe5', borderColor: '#edebe5', color: '#000000' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#edebe5';
                              e.currentTarget.style.borderColor = '#ee6b17';
                              e.currentTarget.style.color = '#000000';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#edebe5';
                              e.currentTarget.style.borderColor = '#edebe5';
                              e.currentTarget.style.color = '#000000';
                            }}
                        >
                            <span className="text-sm font-medium mr-1">{item.name}</span>
                            <span className="text-xs font-bold text-[#ee6b17]">{item.str}</span>
                        </button>
                    )) : <span className="text-sm pt-1 text-[#404823]">Нет солнца</span>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
