import React, { useState, useEffect, useMemo } from 'react';
import { CITIES } from './constants';
import { CityAnalysisResult, LoadingState } from './types';
import { analyzeCity, getWeekendDates } from './services/weatherService';
import LoadingScreen from './components/LoadingScreen';
import SummaryView from './components/SummaryView';
import CityDetail from './components/CityDetail';

const App: React.FC = () => {
  const [data, setData] = useState<CityAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ total: 0, current: 0, status: 'Starting...' });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'w1' | 'w2'>('w1');
  
  // Date Logic
  const dates = useMemo(() => getWeekendDates(), []);
  
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  const w1Label = `${formatDate(dates[0])} - ${formatDate(dates[1])}`;
  const w2Label = `${formatDate(dates[2])} - ${formatDate(dates[3])}`;

  useEffect(() => {
    const fetchData = async () => {
      const cityNames = Object.keys(CITIES).sort();
      const results: CityAnalysisResult[] = [];
      const total = cityNames.length;

      setLoading({ total, current: 0, status: 'Загрузка списка...' });

      // We process in small chunks to allow UI updates if needed, though mostly React handles this.
      // We use Promise.all to be faster than the python script, but let's do batches to be polite to API.
      const BATCH_SIZE = 5;
      
      for (let i = 0; i < total; i += BATCH_SIZE) {
         const batch = cityNames.slice(i, i + BATCH_SIZE);
         const promises = batch.map(name => {
             setLoading(prev => ({ ...prev, current: prev.current, status: `Анализ: ${name}` }));
             return analyzeCity(name, CITIES[name], dates);
         });

         const batchResults = await Promise.all(promises);
         batchResults.forEach(res => {
             if (res) results.push(res);
         });
         
         setLoading(prev => ({ ...prev, current: i + batch.length }));
      }

      setData(results);
      setLoading({ total: 0, current: 0, status: 'Done' });
    };

    fetchData();
  }, [dates]);

  const selectedData = useMemo(() => {
      if (!selectedCity) return null;
      return data.find(c => c.cityName === selectedCity) || null;
  }, [data, selectedCity]);

  const handleCitySelect = (city: string, tab: 'w1' | 'w2') => {
      setInitialTab(tab);
      setSelectedCity(city);
  };

  // Handle Main View
  if (loading.total > 0 && loading.current < loading.total) {
      return <LoadingScreen state={loading} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
        <h1 
            onClick={() => setSelectedCity(null)}
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
        >
            Выбор места для райда (сб, вс)
        </h1>
        <p className="text-xs text-slate-500">Поиск идеальной погоды без осадков</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {!selectedCity ? (
            <>
                {/* Introduction */}
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                    <p className="text-sm opacity-90 mb-1">Ближайшие выходные</p>
                    <div className="text-2xl font-bold">{w1Label}</div>
                    <div className="mt-4 pt-4 border-t border-blue-500 flex justify-between items-end">
                        <span className="text-xs opacity-75">Через неделю: {w2Label}</span>
                    </div>
                </div>

                {/* Summaries */}
                <SummaryView 
                    data={data} 
                    weekendLabel="Ближайшие выходные" 
                    onCityClick={(city) => handleCitySelect(city, 'w1')} 
                />
                <SummaryView 
                    data={data} 
                    weekendLabel="Через неделю" 
                    isSecondWeekend={true} 
                    onCityClick={(city) => handleCitySelect(city, 'w2')} 
                />
                
                {/* City Picker */}
                <div className="pt-4">
                   <h3 className="text-lg font-bold text-slate-800 mb-3">Детальный прогноз</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {data.map(city => (
                           <button 
                             key={city.cityName}
                             onClick={() => handleCitySelect(city.cityName, 'w1')}
                             className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 active:bg-blue-50 transition-colors text-left"
                           >
                               {city.cityName}
                           </button>
                       ))}
                   </div>
                </div>
            </>
        ) : (
            selectedData && (
                <CityDetail 
                    data={selectedData} 
                    initialTab={initialTab}
                    onClose={() => setSelectedCity(null)} 
                />
            )
        )}
      </div>
    </div>
  );
};

export default App;