import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { CityAnalysisResult, WeatherDayStats } from '../types';
import { CITIES } from '../constants';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityDetailProps {
  data: CityAnalysisResult;
  initialTab?: 'w1' | 'w2';
  onClose: () => void;
}

// Map degrees to 8 cardinal directions for file naming
// 0/360=N, 45=NE, 90=E, 135=SE, 180=S, 225=SW, 270=W, 315=NW
const getCardinal = (angle: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
};

interface WeatherCardProps { 
    stats: WeatherDayStats | null; 
    isSelected?: boolean; 
    onClick?: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ stats, isSelected, onClick }) => {
    if (!stats) return <div className="p-4 text-center text-slate-400">Нет данных</div>;

    const dryColor = stats.isDry ? 'text-green-600' : 'text-red-500';
    const minTemp = parseInt(stats.tempRange.split('..')[0]);
    const isTooCold = stats.clothingHints.length === 0 && minTemp < 5;
    
    return (
        <div 
            onClick={onClick}
            className={`rounded-xl border transition-all cursor-pointer bg-white shadow-sm overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-slate-200 hover:border-blue-300'}`}
        >
            <div className={`px-4 py-3 border-b flex justify-between items-center ${isSelected ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                    <span className="font-bold text-slate-800 text-lg mr-2">{stats.dayName}</span>
                    <span className="text-slate-500 text-sm">{stats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                </div>
                {isSelected && (
                    <span className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full shadow-sm">
                        Выбран
                    </span>
                )}
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
                    <div className="text-xs mt-1">
                        <span className="text-slate-500">{stats.windDir}</span>
                        <span className="text-slate-400 ml-1">Пор: {stats.windGusts} км/ч</span>
                    </div>
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
  const [routeDay, setRouteDay] = useState<'saturday' | 'sunday' | null>(null);
  const [routeStatus, setRouteStatus] = useState<string>('');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const windMarkerRef = useRef<L.Marker | null>(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [data.cityName]);

  const activeWeekend = activeTab === 'w1' ? data.weekend1 : data.weekend2;
  
  // Set default route day logic: Prefer Dry Saturday -> Dry Sunday -> Saturday
  useEffect(() => {
      // We only set default if nothing is selected or if we switched weekends
      if (activeWeekend.saturday?.isDry) {
          setRouteDay('saturday');
      } else if (activeWeekend.sunday?.isDry) {
          setRouteDay('sunday');
      } else {
          setRouteDay('saturday');
      }
  }, [activeTab, activeWeekend]);

  const activeStats = routeDay === 'saturday' ? activeWeekend.saturday : activeWeekend.sunday;
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
        
        // Critical fix: Invalidate size after render to prevent gray tiles
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }
    }
  }, [cityCoords]);

  // Load Route Logic & Wind Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeStats || !cityCoords) return;

    // --- GPX ROUTE HANDLING ---
    // Reset previous layer
    if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
    }

    // Determine direction code for file
    const windDirCode = getCardinal(activeStats.windDeg);
    
    // Relative path (assumes /public/routes or root routes folder)
    const fileName = `routes/${data.cityName}_${windDirCode}.gpx`;
    
    setRouteStatus(`Поиск...`);

    // Attempt to load GPX
    fetch(fileName)
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(xmlStr => {
            const latlngs = parseGpx(xmlStr);
            if (latlngs.length > 0) {
                const polyline = L.polyline(latlngs, { color: 'red', weight: 4 }).addTo(map);
                map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
                polylineRef.current = polyline;
                setRouteStatus(`Маршрут найден`);
            } else {
                setRouteStatus(`Маршрут под такое направление ветра не создавался`);
                map.setView([cityCoords.lat, cityCoords.lon], 11);
            }
        })
        .catch(() => {
            setRouteStatus(`Маршрут под такое направление ветра не создавался`);
            map.setView([cityCoords.lat, cityCoords.lon], 11);
        });

    // --- WIND MARKER HANDLING ---
    if (windMarkerRef.current) {
        windMarkerRef.current.remove();
        windMarkerRef.current = null;
    }

    // Calculate rotation: Wind comes FROM deg. Arrow points TO (deg + 180).
    const arrowRotation = (activeStats.windDeg + 180) % 360;

    const windIconHtml = `
        <div class="relative flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg border-2 border-blue-500">
            <div style="transform: rotate(${arrowRotation}deg);" class="transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            </div>
        </div>
    `;

    const windIcon = L.divIcon({
        className: 'custom-wind-marker',
        html: windIconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20], // Center it
    });

    const marker = L.marker([cityCoords.lat, cityCoords.lon], { 
        icon: windIcon,
        zIndexOffset: 1000 // Ensure it sits on top of the route
    }).addTo(map);
    
    windMarkerRef.current = marker;
        
    // Keep map fresh
    setTimeout(() => map.invalidateSize(), 200);

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
          <p className="text-xs text-slate-500 font-medium text-center">Нажмите на карточку дня для выбора маршрута</p>
          
          <WeatherCard 
            stats={activeWeekend.saturday} 
            isSelected={routeDay === 'saturday'} 
            onClick={() => setRouteDay('saturday')}
          />
          <WeatherCard 
            stats={activeWeekend.sunday} 
            isSelected={routeDay === 'sunday'} 
            onClick={() => setRouteDay('sunday')}
          />
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                    Маршрут ({routeDay === 'saturday' ? 'Суббота' : 'Воскресенье'})
                </h3>
                
                {activeStats && (
                    <div className="flex flex-col items-end text-right">
                        <span className="text-sm font-medium text-slate-700">
                           Ветер: {activeStats.windDir}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded mt-1 font-mono inline-block ${routeStatus.includes('не создавался') ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                            {routeStatus}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="relative w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-100 z-0">
                <div ref={mapContainerRef} className="w-full h-full" />
            </div>
            
            <div className="mt-4 flex flex-col items-center text-center space-y-2">
                <p className="text-xs text-slate-400 max-w-lg">
                   Маршрут подбирается автоматически по направлению ветра.
                </p>
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