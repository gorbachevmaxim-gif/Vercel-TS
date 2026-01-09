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
  const [error, setError] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'w1' | 'w2'>('w1');
  const [initialDay, setInitialDay] = useState<'saturday' | 'sunday'>('saturday'); // New state for initial day
  
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

    const fetchDataAndHandleErrors = async () => {
      try {
        await fetchData();
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || 'An unknown error occurred while fetching data.');
      }
    };
    fetchDataAndHandleErrors();
  }, [dates]);

  const selectedData = useMemo(() => {
      if (!selectedCity) return null;
      return data.find(c => c.cityName === selectedCity) || null;
  }, [data, selectedCity]);

  const handleCitySelect = (city: string, tab: 'w1' | 'w2', day: 'saturday' | 'sunday') => { // Updated signature
      setInitialTab(tab);
      setSelectedCity(city);
      setInitialDay(day); // Set initialDay state
  };

    // Handle Main View
    if (showLoading) {
            return <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />;
    }

    return (
        <div className="min-h-screen text-slate-900 pb-10 bg-[#edebe5]">
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-auto max-w-2xl mt-4" role="alert">
          <strong className="font-bold">Ошибка: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-sm">
        <h1 
            onClick={() => setSelectedCity(null)}
            className="text-lg font-bold cursor-pointer text-center text-[rgb(64,72,35)]"
        >
            ПОДБОР МЕСТА ДЛЯ РАЙДА
        </h1>
        <p className="text-xs text-center text-[#404823]">поиск идеальной погоды без осадков на сб и вс</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {!selectedCity ? (
            <>
                {/* Summaries */}
                <SummaryView 
                    data={data} 
                    title="Ближайшие выходные"
                    dateLabel={w1Label} 
                    onCityClick={(city, day) => handleCitySelect(city, 'w1', day)}
                    overrideSundayClick={(city) => handleCitySelect(city, 'w2', 'sunday')}
                />
                <SummaryView 
                    data={data} 
                    title="Через неделю"
                    dateLabel={w2Label} 
                    isSecondWeekend={true} 
                    onCityClick={(city, day) => handleCitySelect(city, 'w2', day)} // Updated call
                />
                
                {/* City Picker */}
                <div className="pt-4">
                   <h3 className="text-lg font-bold text-slate-800 mb-3">Детальный прогноз</h3>
                   {data.length > 0 ? (
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {data.map(city => (
                               <button 
                                 key={city.cityName}
                                 onClick={() => handleCitySelect(city.cityName, 'w1', 'saturday')} // Updated call, default to saturday
                                 className="px-3 py-2 bg-white border rounded-lg text-sm font-medium transition-colors text-left text-black border-[#d1cdc4] hover:border-[#4f6814] hover:bg-[#4a5427] hover:text-white"
                               >
                                   {city.cityName}
                               </button>
                           ))}
                       </div>
                   ) : (
                       <div className="p-4 text-center italic bg-white rounded-lg border border-slate-200 text-[#404823]">
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
                    initialDay={initialDay} // Pass initialDay to CityDetail
                    onClose={() => setSelectedCity(null)} 
                />
            )
        )}
      </div>
    </div>
  );
};

export default App;
