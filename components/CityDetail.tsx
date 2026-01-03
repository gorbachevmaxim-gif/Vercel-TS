import React, { useState } from 'react';
import { CityAnalysisResult, WeatherDayStats } from '../types';

interface CityDetailProps {
  data: CityAnalysisResult;
  onClose: () => void;
}

const WeatherCard: React.FC<{ stats: WeatherDayStats | null }> = ({ stats }) => {
    if (!stats) return <div className="p-4 text-center text-slate-400">Нет данных</div>;

    const dryColor = stats.isDry ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    const statusText = stats.isDry ? 'Без осадков' : 'Ожидаются осадки';

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <div className="text-lg font-bold text-slate-800">{stats.dayName}</div>
                    <div className="text-sm text-slate-500">{stats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${dryColor}`}>
                    {statusText}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="bg-slate-50 p-2 rounded">
                    <div className="text-slate-400 text-xs mb-1">Температура</div>
                    <div className="font-semibold text-slate-700">{stats.tempRange}°</div>
                    <div className="text-xs text-slate-500">Ощущ: {stats.feelsRange}°</div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                    <div className="text-slate-400 text-xs mb-1">Ветер</div>
                    <div className="font-semibold text-slate-700">{stats.windRange} км/ч</div>
                    <div className="text-xs text-slate-500">Макс: {stats.windMax} ({stats.windDir})</div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-amber-50 p-2 rounded border border-amber-100 mb-3">
                 <span className="text-xs font-bold text-amber-700 uppercase">☀️ Солнце (09-18)</span>
                 <span className="font-bold text-slate-700">{stats.sunStr}</span>
            </div>

            {!stats.isDry && (
                <div className="bg-red-50 p-3 rounded text-sm border border-red-100">
                    <div className="flex justify-between mb-1">
                         <span className="text-red-700 font-medium">Осадки:</span>
                         <span className="font-bold text-slate-800">{stats.precipSum.toFixed(1)} мм</span>
                    </div>
                    {stats.rainHours ? (
                        <div className="text-xs text-slate-600 mt-1">
                            🕒 {stats.rainHours}
                        </div>
                    ) : <div className="text-xs text-slate-500">Небольшие осадки</div>}
                </div>
            )}
        </div>
    );
};

const CityDetail: React.FC<CityDetailProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<'w1' | 'w2'>('w1');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{data.cityName}</h2>
        <button onClick={onClose} className="text-sm font-medium text-blue-600 hover:text-blue-800">
            ← Назад
        </button>
      </div>

      <div className="flex p-1 bg-slate-100 rounded-lg">
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'w1' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            onClick={() => setActiveTab('w1')}
          >
              Ближайшие
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'w2' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
            onClick={() => setActiveTab('w2')}
          >
              Через неделю
          </button>
      </div>

      <div className="space-y-4">
          <WeatherCard stats={activeTab === 'w1' ? data.weekend1.saturday : data.weekend2.saturday} />
          <WeatherCard stats={activeTab === 'w1' ? data.weekend1.sunday : data.weekend2.sunday} />
      </div>
    </div>
  );
};

export default CityDetail;