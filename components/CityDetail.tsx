import React, { useState, useEffect, useRef } from 'react';
import { CityAnalysisResult, WeatherDayStats } from '../types';
import { CITIES } from '../constants';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityDetailProps {
  data: CityAnalysisResult;
  initialTab?: 'w1' | 'w2';
  onClose: () => void;
}

// Map degrees to 8 cardinal directions for file naming (e.g. "NW", "S")
const getCardinal = (angle: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
};

const WeatherCard: React.FC<{ stats: WeatherDayStats | null }> = ({ stats }) => {
    if (!stats) return <div className="p-4 text-center text-slate-400">Нет данных</div>;

    const dryColor = stats.isDry ? 'text-green-600' : 'text-red-500';
    const minTemp = parseInt(stats.tempRange.split('..')[0]);
    const isTooCold = stats.clothingHints.length === 0 && minTemp < 5;
    
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <span className="font-bold text-slate-800 text-lg mr-2">{stats.dayName}</span>
                    <span className="text-slate-500 text-sm">{stats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 uppercase font-semibold mb-1">Температура</span>
                    <span className="text-lg font-bold text-slate-700">{stats.tempRange}°</span>
                    <span className="text-xs text-slate-500">Ощущ: {stats.feelsRange}°</span>
                </div>

                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 uppercase font-semibold mb-1">Ветер</span>
                    <span className="text-lg font-bold text-slate-700">{stats.windRange} <span className="text-sm font-normal">км/ч</span></span>
                    <span className="text-xs text-slate-500">{stats.windDir} Порывы: {stats.windGusts}</span>
                </div>

                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 uppercase font-semibold mb-1">Осадки</span>
                    <span className={`text-lg font-bold ${dryColor}`}>
                        {stats.isDry ? '0 мм' : `${stats.precipSum.toFixed(1)} мм`}
                    </span>
                    <span className="text-xs text-slate-500">
                        {stats.isDry ? 'Без осадков' : (stats.rainHours || 'Весь день')}
                    </span>
                </div>

                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 uppercase font-semibold mb-1">Солнце</span>
                    <span className="text-lg font-bold text-amber-500">{stats.sunStr}</span>
                    <span className="text-xs text-slate-500">09:00 - 18:00</span>
                </div>
            </div>

            {stats.clothingHints.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 p-4">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                        👕 Что надеть
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.clothingHints.map((hint, idx) => (
                            <span 
                                key={idx} 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {hint}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            
            {!stats.isDry && stats.isMorningRideSuitable && !isTooCold && (
                 <div className="bg-slate-50 border-t border-slate-100 p-3 text-xs text-slate-600 text-center font-medium">
                    Небольшой райд до дождя
                 </div>
            )}
            
            {isTooCold && (
                 <div className="bg-slate-50 border-t border-slate-100 p-3 text-xs text-slate-600 text-center font-medium">
                    Слишком холодно для комфортного заезда (&lt; 5°C)
                 </div>
            )}
        </div>
    );
};

// Helper to parse basic GPX (trkpt only)
const parseGpx = (str: string): [number, number][] => {
    try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, "text/xml");
        const points: [number, number][] = [];
        const trkpts = xml.querySelectorAll('trkpt');
        trkpts.forEach(pt => {
            const lat = parseFloat(pt.getAttribute('lat') || '0');
            const lon = parseFloat(pt.getAttribute('lon') || '0');
            if (lat && lon) points.push([lat, lon]);
        });
        return points;
    } catch (e) {
        console.error("GPX Parse error", e);
        return [];
    }
};

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = 'w1', onClose }) => {
  const [activeTab, setActiveTab] = useState<'w1' | 'w2'>(initialTab);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [data.cityName]);

  const activeWeekend = activeTab === 'w1' ? data.weekend1 : data.weekend2;
  // Prefer saturday for route selection if it's dry, otherwise sunday, otherwise saturday
  const activeStats = (activeWeekend.saturday?.isDry && activeWeekend.saturday) 
                      || activeWeekend.sunday 
                      || activeWeekend.saturday;

  const cityCoords = CITIES[data.cityName];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || !cityCoords) return;

    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([cityCoords.lat, cityCoords.lon], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
    }

    // Cleanup function
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    }
  }, [cityCoords]);

  // Load Route Logic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeStats || !cityCoords) return;

    // Reset previous layer
    if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
    }

    // Determine direction
    const windDirCode = getCardinal(activeStats.windDeg);
    // Relative path for compatibility with GH Pages sub-paths
    const fileName = `routes/${data.cityName}_${windDirCode}.gpx`;
    
    // Attempt to load GPX
    fetch(fileName)
        .then(res => {
            if (!res.ok) throw new Error("No route found");
            return res.text();
        })
        .then(xmlStr => {
            const latlngs = parseGpx(xmlStr);
            if (latlngs.length > 0) {
                const polyline = L.polyline(latlngs, { color: 'red', weight: 4 }).addTo(map);
                map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
                polylineRef.current = polyline;
            } else {
                // Fallback: Just center on city
                map.setView([cityCoords.lat, cityCoords.lon], 11);
            }
        })
        .catch(() => {
            // No route file found for this condition
            // Add a marker for the city at least
             map.setView([cityCoords.lat, cityCoords.lon], 11);
        });

  }, [activeStats, cityCoords, data.cityName]);


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{data.cityName}</h2>
        <button onClick={onClose} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Назад
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

      <div className="space-y-6">
          <WeatherCard stats={activeTab === 'w1' ? data.weekend1.saturday : data.weekend2.saturday} />
          <WeatherCard stats={activeTab === 'w1' ? data.weekend1.sunday : data.weekend2.sunday} />
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                    Маршрут
                </h3>
                {activeStats && (
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                        Ветер: {activeStats.windDir} ({getCardinal(activeStats.windDeg)})
                    </span>
                )}
            </div>
            
            <div className="relative w-full h-[350px] bg-slate-100 rounded-lg overflow-hidden border border-slate-100 z-0">
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            
            <div className="mt-4 flex justify-center">
                <a 
                    href="https://www.komoot.com/collection/2674102/-lechappe-belle?ref=collection" 
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-colors shadow-sm"
                >
                    Все маршруты Gastrodinamica
                </a>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CityDetail;