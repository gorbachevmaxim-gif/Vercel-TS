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
    <div className="min-h-screen bg-komoot-light text-komoot-dark font-sans pb-10">
      
      {/* Simple Clean Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center justify-center shadow-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedCity(null)}>
             <div className="w-8 h-8 rounded-full overflow-hidden">
                <GastrodinamikaLogo percent={100} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Gastrodinamika
            </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {!selectedCity ? (
            <div className="space-y-8 animate-fade-in">
                
                {/* Intro Block */}
                <div className="text-center space-y-2">
                     <h2 className="text-3xl font-bold text-slate-900">Поиск идеальных выходных</h2>
                     <p className="text-slate-500">
                        Мы проанализировали {data.length} направлений, чтобы найти, где сухо и солнечно.
                     </p>
                </div>

                {/* Date Switcher */}
                <div className="flex justify-center">
                    <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => setActiveWeekendTab('w1')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeWeekendTab === 'w1' 
                                ? 'bg-komoot-green text-white shadow-sm' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Ближайшие ({w1Label})
                        </button>
                        <button 
                             onClick={() => setActiveWeekendTab('w2')}
                             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                activeWeekendTab === 'w2' 
                                ? 'bg-komoot-green text-white shadow-sm' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            Через неделю ({w2Label})
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <SummaryView 
                    data={data} 
                    title=""
                    dateLabel=""
                    isSecondWeekend={activeWeekendTab === 'w2'} 
                    onCityClick={handleCitySelect} 
                />

                 {/* All Cities List */}
                 <div className="pt-8 border-t border-slate-200">
                   <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Все направления</h3>
                   <div className="flex flex-wrap justify-center gap-2">
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