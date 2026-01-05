import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { CityAnalysisResult, WeatherDayStats } from '../types';
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from '../constants';
import { getCardinal } from '../services/weatherService';
import TransportBlock from './TransportBlock';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityDetailProps {
  data: CityAnalysisResult;
  initialTab?: 'w1' | 'w2';
  onClose: () => void;
}

interface RouteData {
    points: [number, number][];
    distanceKm: number;
    elevationM: number;
}

interface WeatherCardProps { 
    stats: WeatherDayStats | null; 
    isSelected?: boolean; 
    onClick?: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ stats, isSelected, onClick }) => {
    if (!stats) return <div className="p-4 text-center text-slate-400 bg-white rounded-xl border border-slate-200">Нет данных</div>;

    const dryColor = stats.isDry ? 'text-green-600' : 'text-red-500';
    const minTemp = parseInt(stats.tempRange.split('..')[0]);
    const windRotation = (stats.windDeg + 180) % 360;

    return (
        <div 
            onClick={onClick}
            className={`rounded-xl transition-all cursor-pointer bg-white overflow-hidden ${
                isSelected 
                ? 'border-2 border-komoot-green shadow-md ring-1 ring-komoot-green/20' 
                : 'border border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
        >
            <div className={`px-4 py-3 border-b flex justify-between items-center ${isSelected ? 'bg-komoot-green/5 border-komoot-green/20' : 'bg-slate-50 border-slate-100'}`}>
                <div>
                    <span className="font-bold text-slate-800 text-lg mr-2">{stats.dayName}</span>
                    <span className="text-slate-500 text-sm font-medium">{stats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                </div>
                {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-komoot-green flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Температура</span>
                    <span className="text-xl font-bold text-slate-800">{stats.tempRange}°</span>
                    <span className="text-xs text-slate-500 font-medium mt-1">Ощущ: {stats.feelsRange}°</span>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Ветер</span>
                    <span className="text-xl font-bold text-slate-800">{stats.windRange}</span>
                    <div className="flex items-center justify-center mt-1 text-slate-500 gap-1.5">
                        <svg 
                            style={{ transform: `rotate(${windRotation}deg)` }}
                            className="transition-transform duration-300 text-slate-400"
                            xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                        <span className="text-xs font-medium">{stats.windDir}</span>
                    </div>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Осадки</span>
                    <span className={`text-xl font-bold ${dryColor}`}>
                        {stats.isDry ? '0' : stats.precipSum.toFixed(1)}
                        <span className="text-xs font-normal text-slate-400 ml-1">мм</span>
                    </span>
                    <span className="text-xs text-slate-500 font-medium mt-1">
                        {stats.isDry ? 'Сухо' : (stats.rainHours || 'Весь день')}
                    </span>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Солнце</span>
                    <span className="text-xl font-bold text-amber-500">{stats.sunStr}</span>
                </div>
            </div>

            {stats.clothingHints.length > 0 && (
                <div className="bg-slate-50 border-t border-slate-100 p-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        👕 Рекомендации
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.clothingHints.map((hint, idx) => (
                            <span 
                                key={idx} 
                                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-sm"
                            >
                                {hint}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ... (Helper functions: getDistanceFromLatLonInKm, parseGpx remain the same) ...
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const parseGpx = (str: string): RouteData | null => {
    try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(str, "text/xml");
        const parseError = xml.querySelector('parsererror');
        if (parseError) return null;
        const getAttr = (el: Element, name: string) => {
            const val = el.getAttribute(name);
            return val ? parseFloat(val) : NaN;
        };
        const allElements = Array.from(xml.getElementsByTagName('*'));
        let pointsElements = allElements.filter(el => (el.localName === 'trkpt' || el.nodeName === 'trkpt'));
        if (pointsElements.length === 0) {
            pointsElements = allElements.filter(el => (el.localName === 'rtept' || el.nodeName === 'rtept'));
        }
        if (pointsElements.length === 0) return null;
        const points: [number, number][] = [];
        let totalDist = 0;
        let totalElev = 0;
        let prevLat = 0;
        let prevLon = 0;
        let prevEle = -10000;
        pointsElements.forEach((pt, index) => {
            const lat = getAttr(pt, 'lat');
            const lon = getAttr(pt, 'lon');
            let ele = NaN;
            const children = Array.from(pt.children);
            const eleNode = children.find(c => c.localName === 'ele' || c.nodeName === 'ele');
            if (eleNode && eleNode.textContent) ele = parseFloat(eleNode.textContent);
            if (!isNaN(lat) && !isNaN(lon)) {
                points.push([lat, lon]);
                if (index > 0) {
                    const dist = getDistanceFromLatLonInKm(prevLat, prevLon, lat, lon);
                    totalDist += dist;
                    if (!isNaN(ele) && prevEle !== -10000) {
                        const diff = ele - prevEle;
                        if (diff > 0) totalElev += diff;
                    }
                }
                prevLat = lat;
                prevLon = lon;
                if (!isNaN(ele)) prevEle = ele;
            }
        });
        if (points.length === 0) return null;
        return { points, distanceKm: totalDist, elevationM: totalElev };
    } catch (e) {
        return null;
    }
};

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = 'w1', onClose }) => {
  const [activeTab, setActiveTab] = useState<'w1' | 'w2'>(initialTab);
  const [routeDay, setRouteDay] = useState<'saturday' | 'sunday' | null>(null);
  const [routeStatus, setRouteStatus] = useState<string>('');
  const [foundRoutes, setFoundRoutes] = useState<RouteData[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const decorativeMarkersRef = useRef<L.Marker[]>([]);
  
  useEffect(() => { window.scrollTo(0, 0); }, [data.cityName]);

  const activeWeekend = activeTab === 'w1' ? data.weekend1 : data.weekend2;
  
  useEffect(() => {
      if (activeWeekend.saturday?.isDry) setRouteDay('saturday');
      else if (activeWeekend.sunday?.isDry) setRouteDay('sunday');
      else setRouteDay('saturday');
  }, [activeTab, activeWeekend]);

  const activeStats = routeDay === 'saturday' ? activeWeekend.saturday : activeWeekend.sunday;
  const cityCoords = CITIES[data.cityName];
  const currentRoute = foundRoutes[selectedRouteIdx];
  const isFlightDestination = FLIGHT_CITIES.includes(data.cityName);

  // --- Transport Logic (Simplified for layout) ---
  const moscow = CITIES['Москва'];
  const moscowLat = moscow ? moscow.lat : 55.75;
  const moscowLon = moscow ? moscow.lon : 37.61;
  let routeStartLat = cityCoords.lat;
  let routeStartLon = cityCoords.lon;
  let routeEndLat = cityCoords.lat;
  let routeEndLon = cityCoords.lon;

  if (currentRoute && currentRoute.points.length > 0) {
      routeStartLat = currentRoute.points[0][0];
      routeStartLon = currentRoute.points[0][1];
      const lastIdx = currentRoute.points.length - 1;
      routeEndLat = currentRoute.points[lastIdx][0];
      routeEndLon = currentRoute.points[lastIdx][1];
  }
  const findClosestCityName = (lat: number, lon: number) => {
      let closestName = data.cityName;
      let minD = Infinity;
      for (const [name, coords] of Object.entries(CITIES)) {
          const d = getDistanceFromLatLonInKm(lat, lon, coords.lat, coords.lon);
          if (d < minD) { minD = d; closestName = name; }
      }
      return closestName;
  };
  const routeStartCity = findClosestCityName(routeStartLat, routeStartLon);
  const routeEndCity = findClosestCityName(routeEndLat, routeEndLon);
  const distStartMsc = getDistanceFromLatLonInKm(routeStartLat, routeStartLon, moscowLat, moscowLon);
  const distEndMsc = getDistanceFromLatLonInKm(routeEndLat, routeEndLon, moscowLat, moscowLon);
  const showTo = distStartMsc > 20;
  const showFrom = distEndMsc > 20;
  const showTransportBlock = isFlightDestination || ((showTo || showFrom) && (distStartMsc <= 300));

  // Map Init
  useEffect(() => {
    if (!mapContainerRef.current || !cityCoords) return;
    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([cityCoords.lat, cityCoords.lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }
  }, [cityCoords]);

  // Load GPX
  useEffect(() => {
    let isMounted = true;
    if (!activeStats || !cityCoords) return;
    if (isFlightDestination) { setRouteStatus('Авианаправление'); setFoundRoutes([]); return; }

    const windDirCode = getCardinal(activeStats.windDeg);
    setRouteStatus('Поиск...');
    setFoundRoutes([]);
    setSelectedRouteIdx(0);
    const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
    const baseName = `routes/${fileCityName}_${windDirCode}`;
    const candidates = [`${baseName}.gpx`, `${baseName}_1.gpx`, `${baseName}_2.gpx`, `${baseName}_3.gpx`];

    const fetchRoute = async (url: string) => {
        try {
            const res = await fetch(`${url}?t=${Date.now()}`);
            if (!res.ok) return null;
            const txt = await res.text();
            if (!txt.trim().startsWith('<')) return null;
            return parseGpx(txt);
        } catch { return null; }
    };

    Promise.all(candidates.map(url => fetchRoute(url))).then(results => {
        if (!isMounted) return;
        const validRoutes = results.filter((r): r is RouteData => r !== null);
        if (validRoutes.length > 0) { setFoundRoutes(validRoutes); setRouteStatus(`Найдено: ${validRoutes.length}`); }
        else { setFoundRoutes([]); setRouteStatus(`Маршрут под ветер ${windDirCode} не найден`); }
    });
    return () => { isMounted = false; };
  }, [activeStats, cityCoords, data.cityName, isFlightDestination]);

  // Draw Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeStats || !cityCoords) return;
    map.invalidateSize();
    
    // Clear previous elements
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (startMarkerRef.current) { startMarkerRef.current.remove(); startMarkerRef.current = null; }
    decorativeMarkersRef.current.forEach(m => m.remove());
    decorativeMarkersRef.current = [];

    let startPoint: L.LatLngExpression = [cityCoords.lat, cityCoords.lon];
    const routePoints = currentRoute?.points;

    if (routePoints && routePoints.length > 0) {
        // 1. Draw Polyline (Komoot Blue)
        const polyline = L.polyline(routePoints, { 
            color: '#347aff', // Komoot Blue
            weight: 5, 
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);
        polylineRef.current = polyline;
        startPoint = routePoints[0];
        
        // 2. Add Decorative Wind Markers along the route
        const arrowRotation = (activeStats.windDeg + 180) % 360;
        const windIconHtml = `
            <div style="transform: rotate(${arrowRotation}deg);" class="flex items-center justify-center w-6 h-6 bg-white/90 rounded-full border border-blue-600 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            </div>
        `;
        const windIcon = L.divIcon({ className: 'wind-route-marker', html: windIconHtml, iconSize: [24, 24], iconAnchor: [12, 12] });

        // Place 8 markers evenly distributed
        const markersCount = 8;
        const step = Math.floor(routePoints.length / (markersCount + 1));
        
        for (let i = 1; i <= markersCount; i++) {
            const idx = i * step;
            if (routePoints[idx]) {
                const m = L.marker(routePoints[idx], { icon: windIcon, zIndexOffset: 50 }).addTo(map);
                decorativeMarkersRef.current.push(m);
            }
        }

        // 3. Add Finish Flag Marker
        const finishPoint = routePoints[routePoints.length - 1];
        const finishIconHtml = `
            <div class="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-slate-900 shadow-lg transform -translate-y-1">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-slate-900">
                    <path d="M4 15V4a1 1 0 0 1 2 0v1h10.3c.7 0 1.3.8.9 1.4l-1.6 2.6 1.6 2.6c.4.6-.1 1.4-.9 1.4H6v2a1 1 0 0 1-2 0z"/>
                    <path d="M4 19h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"/>
                 </svg>
            </div>
        `;
        const finishIcon = L.divIcon({ className: 'finish-marker', html: finishIconHtml, iconSize: [32, 32], iconAnchor: [16, 30] });
        const finishMarker = L.marker(finishPoint, { icon: finishIcon, zIndexOffset: 100 }).addTo(map);
        decorativeMarkersRef.current.push(finishMarker);

        setTimeout(() => {
            const bounds = polyline.getBounds();
            if (bounds.isValid()) { map.invalidateSize(); map.fitBounds(bounds, { padding: [50, 50] }); }
        }, 150);
    } else {
        map.setView([cityCoords.lat, cityCoords.lon], 11);
    }

    // Start Marker 
    const startIconHtml = `
        <div class="flex items-center justify-center w-8 h-8 bg-slate-900 text-white font-bold rounded-full shadow-lg border-2 border-white">
            A
        </div>
    `;
    const startIcon = L.divIcon({ className: 'start-marker', html: startIconHtml, iconSize: [32, 32], iconAnchor: [16, 16] });
    const marker = L.marker(startPoint, { icon: startIcon, zIndexOffset: 1000 }).addTo(map);
    startMarkerRef.current = marker;

  }, [activeStats, cityCoords, currentRoute]);

  let collectionFocusCoords = cityCoords;
  let collectionZoom = 13;
  if (data.cityName === 'Завидово') { collectionFocusCoords = { lat: 56.592, lon: 36.523 }; }
  if (data.cityName === 'Истра') { collectionFocusCoords = { lat: 55.8985, lon: 36.9025 }; collectionZoom = 11; }

  const yandexMapsUrl = collectionFocusCoords
    ? `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&ll=${collectionFocusCoords.lon},${collectionFocusCoords.lat}&mode=bookmarks&z=${collectionZoom}&utm_source=share&utm_campaign=bookmarks`
    : `https://yandex.ru/maps?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks`;

  return (
    <div className="space-y-6">
      {/* Detail Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <h2 className="text-3xl font-bold text-slate-900">{data.cityName}</h2>
        </div>
        
        {/* Weekend Switcher */}
        <div className="flex bg-white rounded-full border border-slate-200 p-1">
             <button 
                onClick={() => setActiveTab('w1')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'w1' ? 'bg-komoot-green text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Ближайшие
             </button>
             <button 
                onClick={() => setActiveTab('w2')}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 'w2' ? 'bg-komoot-green text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
             >
                Через неделю
             </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Stats & Map Controls */}
          <div className="space-y-6">
               <div className="space-y-4">
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
               </div>
               
               {/* Route Info & Variants */}
               {foundRoutes.length > 0 && (
                 <div className="bg-white rounded-xl border border-slate-200 p-4">
                     <div className="flex justify-between items-center mb-3">
                         <span className="font-bold text-slate-800">Маршрут {routeDay === 'saturday' ? 'на субботу' : 'на воскресенье'}</span>
                         {currentRoute && <span className="text-sm font-medium text-slate-500">{currentRoute.distanceKm.toFixed(1)} км</span>}
                     </div>
                     {foundRoutes.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {foundRoutes.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedRouteIdx(idx)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                                        selectedRouteIdx === idx 
                                        ? 'bg-slate-800 text-white border-slate-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    Вариант {idx + 1}
                                </button>
                            ))}
                        </div>
                     )}
                 </div>
               )}

               {activeStats && showTransportBlock && (
                  <TransportBlock 
                      startCity={routeStartCity} 
                      endCity={routeEndCity} 
                      date={activeStats.dateObj} 
                      showTo={showTo}
                      showFrom={showFrom}
                  />
               )}
               
               <a 
                    href={yandexMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-5 py-4 bg-[#FFCC00] text-slate-900 rounded-xl font-bold hover:bg-[#F0B90B] transition-colors shadow-sm"
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Хорошие места
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
          </div>

          {/* Right Column: Map */}
          <div className="h-[500px] lg:h-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm relative z-0">
               <div ref={mapContainerRef} className="w-full h-full" />
               <div className="absolute bottom-4 left-0 right-0 flex justify-center z-[500]">
                    <a 
                        href="https://www.komoot.com/collection/2674102/-lechappe-belle?ref=collection" 
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur text-komoot-dark text-sm rounded-full font-bold shadow-lg border border-slate-200 hover:bg-white transition-colors"
                    >
                        Открыть в Komoot
                    </a>
               </div>
          </div>
      </div>
    </div>
  );
};

export default CityDetail;