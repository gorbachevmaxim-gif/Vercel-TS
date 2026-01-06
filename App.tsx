import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { CITIES } from './constants';
import { CityAnalysisResult, LoadingState } from './types';
import { analyzeCity, getWeekendDates } from './services/weatherService';
import LoadingScreen from './components/LoadingScreen';
import SummaryView from './components/SummaryView';
import CityDetail from './components/CityDetail';

const App: React.FC = () => {
  const [data, setData] = useState<CityAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ total: 0, current: 0, status: 'Starting...' });
  const [showLoading, setShowLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'w1' | 'w2'>('w1');
  
  // Date Logic
  const dates = useMemo(() => getWeekendDates(), []);
  
  // Format: "14 окт"
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const w1Label = `${formatDate(dates[0])} - ${formatDate(dates[1])}`;
  const w2Label = `${formatDate(dates[2])} - ${formatDate(dates[3])}`;

  useEffect(() => {
    const fetchData = async () => {
      const cityNames = Object.keys(CITIES).sort();
      const results: CityAnalysisResult[] = [];
      const total = cityNames.length;

      setLoading({ total, current: 0, status: 'Загрузка списка...' });

      // Reduced batch size to 3 to prevent API rate limiting
      const BATCH_SIZE = 3;
      
      for (let i = 0; i < total; i += BATCH_SIZE) {
         // Add a small delay between batches
         if (i > 0) await new Promise(resolve => setTimeout(resolve, 300));

         const batch = cityNames.slice(i, i + BATCH_SIZE);
         const promises = batch.map(name => {
             setLoading(prev => ({ ...prev, current: prev.current, status: `Анализ: ${name}` }));
             return analyzeCity(name, CITIES[name], dates);
         });

         const batchResults = await Promise.all(promises);
         batchResults.forEach(res => {
             if (res) results.push(res);
         });
         
         setLoading(prev => ({ ...prev, current: Math.min(total, i + batch.length) }));
      }

      setData(results);
      // Ensure we hit 100% state for the animation logic
      setLoading(prev => ({ ...prev, current: total, status: 'Готово' }));
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
    if (showLoading) {
            return <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />;
    }

    return (
        <div className="min-h-screen text-slate-900 pb-10" style={{ backgroundColor: '#edebe5' }}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
        <h1 
            onClick={() => setSelectedCity(null)}
            className="text-xl font-bold cursor-pointer text-center"
            style={{ color: 'rgb(64, 72, 35)' }}
        >
            Выбор места для райда
        </h1>
        <p className="text-xs text-center" style={{ color: '#404823' }}>Поиск идеальной погоды без осадков (09:00 - 18:00)</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {!selectedCity ? (
            <>
                {/* Summaries */}
                <SummaryView 
                    data={data} 
                    title="Ближайшие выходные"
                    dateLabel={w1Label} 
                    onCityClick={(city) => handleCitySelect(city, 'w1')} 
                />
                <SummaryView 
                    data={data} 
                    title="Через неделю"
                    dateLabel={w2Label} 
                    isSecondWeekend={true} 
                    onCityClick={(city) => handleCitySelect(city, 'w2')} 
                />
                
                {/* City Picker */}
                <div className="pt-4">
                   <h3 className="text-lg font-bold text-slate-800 mb-3">Детальный прогноз</h3>
                   {data.length > 0 ? (
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
                   ) : (
                       <div className="p-4 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
                           Не удалось загрузить данные городов. Попробуйте обновить страницу.
                       </div>
                   )}
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