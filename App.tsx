import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { CITIES } from './constants';
import { CityAnalysisResult, LoadingState } from './types';
import { analyzeCity, getWeekendDates } from './services/weatherService';
import LoadingScreen from './components/LoadingScreen';
import SummaryView from './components/SummaryView';
import CityDetail from './components/CityDetail';
import GastrodinamikaLogo from './components/GastrodinamikaLogo';

const App: React.FC = () => {
  const [data, setData] = useState<CityAnalysisResult[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ total: 0, current: 0, status: 'Starting...' });
  const [showLoading, setShowLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [activeWeekendTab, setActiveWeekendTab] = useState<'w1' | 'w2'>('w1');
  
  // Date Logic
  const dates = useMemo(() => getWeekendDates(), []);
  
  // Format: "14 Oct" style
  const formatDate = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const w1Label = `${formatDate(dates[0])} - ${formatDate(dates[1])}`;
  const w2Label = `${formatDate(dates[2])} - ${formatDate(dates[3])}`;

  useEffect(() => {
    const fetchData = async () => {
      const cityNames = Object.keys(CITIES).sort();
      const results: CityAnalysisResult[] = [];
      const total = cityNames.length;

      setLoading({ total, current: 0, status: 'Загрузка списка...' });

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
      setLoading(prev => ({ ...prev, current: total, status: 'Готово' }));
    };

    fetchData();
  }, [dates]);

  const selectedData = useMemo(() => {
      if (!selectedCity) return null;
      return data.find(c => c.cityName === selectedCity) || null;
  }, [data, selectedCity]);

  const handleCitySelect = (city: string) => {
      setSelectedCity(city);
  };

  // Handle Main View
  if (showLoading) {
      return <LoadingScreen state={loading} onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-komoot-light text-komoot-dark font-sans">
      
      {/* Komoot-style Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6 justify-between shadow-sm">
        <div className="flex items-center gap-6 flex-1">
            {/* Logo Area */}
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => setSelectedCity(null)}>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                    <GastrodinamikaLogo percent={100} />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">
                    Gastrodinamika
                </span>
            </div>

            {/* Fake Search Bar */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-full max-w-md text-slate-500">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
                 <span className="text-sm font-medium">Поиск маршрутов и мест...</span>
            </div>
        </div>

        {/* Nav Links (Visual Only) */}
        <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                <span className="hover:text-slate-900 cursor-pointer">Туры</span>
                <span className="hover:text-slate-900 cursor-pointer">Карты</span>
            </nav>
            
            {/* "New" Button style from Screenshot */}
            <button className="hidden sm:flex items-center gap-1 bg-[#4f7c1b] text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-[#436a17] transition-colors">
                Новое
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-300 cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!selectedCity ? (
            <div className="space-y-8 animate-fade-in">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Планировщик выходных
                    </h1>
                    <div className="hidden sm:block text-sm text-slate-500 font-medium">
                        {data.length} направлений проанализировано
                    </div>
                </div>

                {/* Filter Chips / Search Bar Styled */}
                <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 flex items-center w-full max-w-full overflow-x-auto no-scrollbar">
                     <div className="px-4 py-2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                     </div>
                     <input 
                        type="text" 
                        placeholder="Фильтр по названию..." 
                        className="flex-1 outline-none text-slate-700 placeholder-slate-400 font-medium text-lg min-w-[150px]"
                        disabled
                     />
                     <button className="mr-2 p-2 text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                     </button>
                </div>

                {/* Filter Tabs (Dates) - Komoot Chip Style */}
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setActiveWeekendTab('w1')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                            activeWeekendTab === 'w1' 
                            ? 'bg-komoot-green text-white border-komoot-green shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Ближайшие ({w1Label})
                    </button>
                    <button 
                         onClick={() => setActiveWeekendTab('w2')}
                         className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                            activeWeekendTab === 'w2' 
                            ? 'bg-komoot-green text-white border-komoot-green shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        Через неделю ({w2Label})
                    </button>
                    
                    <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                    
                    <button className="px-4 py-2 rounded-full text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1">
                        Все города
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Content Section */}
                <SummaryView 
                    data={data} 
                    title={activeWeekendTab === 'w1' ? "Прогноз на ближайшие" : "Прогноз через неделю"}
                    dateLabel={activeWeekendTab === 'w1' ? w1Label : w2Label}
                    isSecondWeekend={activeWeekendTab === 'w2'} 
                    onCityClick={handleCitySelect} 
                />

                 {/* All Cities List as Chips */}
                 <div className="pt-8">
                   <h3 className="text-xl font-bold text-slate-900 mb-4">Все направления</h3>
                   <div className="flex flex-wrap gap-2">
                       {data.map(city => (
                           <button 
                             key={city.cityName}
                             onClick={() => handleCitySelect(city.cityName)}
                             className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-komoot-green hover:text-komoot-green hover:shadow-sm transition-all"
                           >
                               {city.cityName}
                           </button>
                       ))}
                   </div>
                </div>
            </div>
        ) : (
            selectedData && (
                <CityDetail 
                    data={selectedData} 
                    initialTab={activeWeekendTab}
                    onClose={() => setSelectedCity(null)} 
                />
            )
        )}
      </main>
    </div>
  );
};

export default App;