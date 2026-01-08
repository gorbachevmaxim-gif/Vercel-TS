import React, { useState, useEffect, useRef } from 'react';
import { CityAnalysisResult, WeatherDayStats } from '../types';
import { CITIES, CITY_FILENAMES, FLIGHT_CITIES } from '../constants';
import { getCardinal } from '../services/weatherService';
import { parseGpx, getDistanceFromLatLonInKm, getBearing, RouteData } from '../services/gpxUtils';
import TransportBlock from './TransportBlock';
import * as L from 'leaflet';

interface CityDetailProps {
  data: CityAnalysisResult;
  initialTab?: 'w1' | 'w2';
  onClose: () => void;
}

interface WeatherCardProps {
    stats: WeatherDayStats | null;
    isSelected?: boolean;
    onClick?: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ stats, isSelected, onClick }) => {
    if (!stats) return <div className="p-4 text-center text-slate-400">Нет данных</div>;

    // Logic: Black if isDry (displayed as 0mm) OR precipSum < 0.5mm. Orange (#ee6b17) otherwise.
    // This fixes the issue where night rain causes precipSum > 0.5 (Orange) but isDry=true displays "0 mm".
    const precipColor = (stats.isDry || stats.precipSum < 0.5) ? 'text-slate-900' : 'text-[#ee6b17]';

    const minTemp = parseInt(stats.tempRange.split('..')[0]);
    const isTooCold = stats.clothingHints.length === 0 && minTemp < 5;
    const windRotation = (stats.windDeg + 180) % 360;

    return (
        <div onClick={onClick} className={`rounded-xl border transition-all cursor-pointer bg-white shadow-sm overflow-hidden ${isSelected ? 'border-transparent ring-4 ring-[#d1cdc4] shadow-md' : 'border-transparent hover:ring-4 hover:ring-[#d1cdc4] hover:shadow-md'}`}>
            <div className={`px-4 py-3 border-b flex justify-between items-center ${isSelected ? 'bg-[#4f6814] border-[#4f6814]' : 'bg-[#e0dbce] border-slate-100'}`}>
                <div>
                    <span className={`font-bold text-lg mr-2 ${isSelected ? 'text-[#e0dbce]' : 'text-slate-800'}`}>{stats.dayName}</span>
                    <span className="text-sm" style={{ color: isSelected ? '#e0dbce' : '#404823' }}>{stats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span>
                </div>
                {isSelected && (
                    <span className="text-xs font-bold bg-white border px-2 py-0.5 rounded-full shadow-sm" style={{ color: '#4f6814', borderColor: 'transparent' }}>
                        Выбран
                    </span>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: '#d1cdc4' }}>
                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#8b8680' }}>Температура</span>
                    <span className="text-lg font-bold text-slate-700">{stats.tempRange}°</span>
                    <span className="text-xs" style={{ color: '#404823' }}>Ощущ: {stats.feelsRange}°</span>
                </div>
                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#8b8680' }}>Ветер</span>
                    <span className="text-lg font-bold text-slate-700">{stats.windRange} <span className="text-sm font-normal">км/ч</span></span>
                    <div className="flex items-center justify-center mt-1 gap-1.5" style={{ color: '#404823' }}>
                        <span className="text-xs font-medium">{stats.windDir}</span>
                        <svg style={{ transform: `rotate(${windRotation}deg)` }} className="transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                        <span className="text-xs">Порывы {stats.windGusts}</span>
                    </div>
                </div>
                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#8b8680' }}>Осадки</span>
                    <span className={`text-lg font-bold ${precipColor}`}>{stats.isDry ? '0 мм' : `${stats.precipSum.toFixed(1)} мм`}</span>
                    <span className="text-xs" style={{ color: '#404823' }}>{stats.isDry ? 'Без осадков' : (stats.rainHours || 'Весь день')}</span>
                </div>
                <div className="p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#8b8680' }}>Солнце</span>
                    <span className="text-lg font-bold text-slate-900">{stats.sunStr}</span>
                    <span className="text-xs" style={{ color: '#404823' }}>09:00 - 18:00</span>
                </div>
            </div>
            {stats.clothingHints.length > 0 && (
                <div className="border-t p-4" style={{ backgroundColor: '#f5f3f0' }}>
                    <div className="text-xs uppercase font-semibold mb-2" style={{ color: '#8b8680' }}>Что надеть</div>
                    <div className="flex flex-wrap gap-2">
                        {stats.clothingHints.map((hint, idx) => (
                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgb(224, 219, 206)', color: '#404823' }}>{hint}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface FoundRoute {
  routeData: RouteData;
  gpxString: string;
}

const CityDetail: React.FC<CityDetailProps> = ({ data, initialTab = 'w1', onClose }) => {
  const [activeTab, setActiveTab] = useState<'w1' | 'w2'>(initialTab);
  const [routeDay, setRouteDay] = useState<'saturday' | 'sunday' | null>(null);
  const [routeStatus, setRouteStatus] = useState<string>('');
  const [foundRoutes, setFoundRoutes] = useState<FoundRoute[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const decorativeMarkersRef = useRef<L.Marker[]>([]);

  const activeWeekend = activeTab === 'w1' ? data.weekend1 : data.weekend2;

  useEffect(() => {
      if (activeWeekend.saturday?.isDry) setRouteDay('saturday');
      else if (activeWeekend.sunday?.isDry) setRouteDay('sunday');
      else setRouteDay('saturday');
  }, [activeTab, activeWeekend]);

  const activeStats = routeDay === 'saturday' ? activeWeekend.saturday : activeWeekend.sunday;
  const cityCoords = CITIES[data.cityName];
  const currentRouteData = foundRoutes[selectedRouteIdx]?.routeData;
  const isFlightDestination = FLIGHT_CITIES.includes(data.cityName);

  const moscow = CITIES['Москва'];
  const moscowLat = moscow ? moscow.lat : 55.75;
  const moscowLon = moscow ? moscow.lon : 37.61;

  let routeStartLat = cityCoords.lat, routeStartLon = cityCoords.lon;
  let routeEndLat = cityCoords.lat, routeEndLon = cityCoords.lon;

  if (currentRouteData && currentRouteData.points.length > 0) {
      routeStartLat = currentRouteData.points[0][0];
      routeStartLon = currentRouteData.points[0][1];
      const lastIdx = currentRouteData.points.length - 1;
      routeEndLat = currentRouteData.points[lastIdx][0];
      routeEndLon = currentRouteData.points[lastIdx][1];
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

  useEffect(() => {
    if (!mapContainerRef.current || !cityCoords) return;
    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([cityCoords.lat, cityCoords.lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapInstanceRef.current = map;
        setTimeout(() => map.invalidateSize(), 100);
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }
  }, [cityCoords]);

  useEffect(() => {
    let isMounted = true;
    if (!activeStats || !cityCoords) return;
    if (isFlightDestination) {
        setRouteStatus('Авианаправление');
        setFoundRoutes([]);
        return;
    }
    const windDirCode = getCardinal(activeStats.windDeg);
    setRouteStatus('Поиск...');
    setFoundRoutes([]);
    setSelectedRouteIdx(0);
    const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
    const baseName = `routes/${fileCityName}_${windDirCode}`;
    const candidates = [`${baseName}.gpx`, `${baseName}_1.gpx`, `${baseName}_2.gpx`, `${baseName}_3.gpx`];

    Promise.all(candidates.map(url =>
      fetch(`${url}?t=${Date.now()}`).then(r => r.ok ? r.text() : Promise.resolve(null))
    ))
    .then(gpxStrings => {
        if (!isMounted) return;
        const validRoutes: FoundRoute[] = gpxStrings
            .map(gpxString => {
                if (!gpxString) return null;
                const routeData = parseGpx(gpxString);
                if (!routeData) return null;
                return { routeData, gpxString };
            })
            .filter((r): r is FoundRoute => r !== null);

        if (validRoutes.length > 0) {
            setFoundRoutes(validRoutes);
            setRouteStatus(`Найдено маршрутов: ${validRoutes.length}`);
        } else {
            setFoundRoutes([]);
            setRouteStatus(`Маршрут под ${activeStats.windDirFull.toLowerCase()} ветер не сделан`);
        }
    });
    return () => { isMounted = false; };
  }, [activeStats, cityCoords, data.cityName, isFlightDestination]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeStats || !cityCoords) return;
    map.invalidateSize();
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    decorativeMarkersRef.current.forEach(m => m.remove());
    decorativeMarkersRef.current = [];

    if (currentRouteData?.points.length) {
        const polyline = L.polyline(currentRouteData.points, { color: 'rgb(36, 87, 195)', weight: 5, opacity: 0.9 }).addTo(map);
        polylineRef.current = polyline;

        const createIcon = (text: string, bgColor: string) => L.divIcon({
            html: `<div style="background-color: ${bgColor}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; items-center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); line-height: 20px;">${text}</div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const startMarker = L.marker(currentRouteData.points[0], { icon: createIcon('A', '#4f6814') }).addTo(map);
        const endMarker = L.marker(currentRouteData.points[currentRouteData.points.length - 1], { icon: createIcon('B', '#ee6b17') }).addTo(map);
        decorativeMarkersRef.current.push(startMarker, endMarker);


        // Add temperature markers
        if (activeStats?.startTemperature !== undefined) {
            const startTempIcon = L.divIcon({
                html: `<div style="background-color: #4f6814; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold; border: 0px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">${activeStats.startTemperature}°C</div>`,
                className: '',
                iconSize: [50, 0], // Size will be determined by content
                iconAnchor: [24, -25] // Adjust to position relative to marker
            });
            const startTempMarker = L.marker(currentRouteData.points[0], { icon: startTempIcon }).addTo(map);
            decorativeMarkersRef.current.push(startTempMarker);
        }
        if (activeStats?.endTemperature !== undefined) {
            const endTempIcon = L.divIcon({
                html: `<div style="background-color: #ee6b17; color: white; padding: 5px 8px; border-radius: 4px; font-weight: bold; border: 0px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">${activeStats.endTemperature}°C</div>`,
                className: '',
                iconSize: [50, 0], // Size will be determined by content
                iconAnchor: [24, 55] // Adjust to position relative to marker
            });
            const endTempMarker = L.marker(currentRouteData.points[currentRouteData.points.length - 1], { icon: endTempIcon }).addTo(map);
            decorativeMarkersRef.current.push(endTempMarker);
        }


        setTimeout(() => {
            const bounds = polyline.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: false });
            }
        }, 100);
    } else {
        map.setView([cityCoords.lat, cityCoords.lon], 11);
    }
  }, [activeStats, cityCoords, currentRouteData]);

  let collectionFocusCoords = cityCoords;
  let collectionZoom = 13;
  if (data.cityName === 'Завидово') { collectionFocusCoords = { lat: 56.592, lon: 36.523 }; }
  if (data.cityName === 'Истра') { collectionFocusCoords = { lat: 55.8985, lon: 36.9025 }; collectionZoom = 11; }

  const yandexMapsUrl = collectionFocusCoords
    ? `https://yandex.ru/maps/?bookmarks%5BpublicId%5D=OfCmg0o9&ll=${collectionFocusCoords.lon},${collectionFocusCoords.lat}&mode=bookmarks&z=${collectionZoom}&utm_source=share&utm_campaign=bookmarks`
    : `https://yandex.ru/maps?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks`;

  const handleDownloadGpx = () => {
    const selectedRoute = foundRoutes[selectedRouteIdx];
    if (!selectedRoute || !activeStats) return;

    const fileCityName = CITY_FILENAMES[data.cityName] || data.cityName;
    const windDirCode = getCardinal(activeStats.windDeg);
    const filename = `${fileCityName}_${windDirCode}${foundRoutes.length > 1 ? `_${selectedRouteIdx + 1}` : ''}.gpx`;

    const blob = new Blob([selectedRoute.gpxString], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{data.cityName}</h2>
        <button onClick={onClose} className="text-sm font-medium hover:text-[#3f5210] flex items-center gap-1" style={{ color: '#4f6814' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Назад
        </button>
      </div>
      <div className="flex p-1 border" style={{ borderColor: 'transparent', borderRadius: 20, backgroundColor: '#d1cdc4' }}>
          <button className={`flex-1 py-2 text-sm font-medium transition-all ${activeTab === 'w1' ? 'bg-[#4f6814] text-white shadow' : 'text-black'}`} style={{ borderRadius: 16 }} onClick={() => setActiveTab('w1')}>Ближайшие выходные</button>
          <button className={`flex-1 py-2 text-sm font-medium transition-all ${activeTab === 'w2' ? 'bg-[#4f6814] text-white shadow' : 'text-black'}`} style={{ borderRadius: 16 }} onClick={() => setActiveTab('w2')}>Через неделю</button>
      </div>
      <div className="space-y-6">
          <WeatherCard stats={activeWeekend.saturday} isSelected={routeDay === 'saturday'} onClick={() => setRouteDay('saturday')} />
          <WeatherCard stats={activeWeekend.sunday} isSelected={routeDay === 'sunday'} onClick={() => setRouteDay('sunday')} />
          <div className="bg-white rounded-xl border border-transparent shadow-sm p-4">
            <div className="flex flex-wrap gap-4 justify-between items-end mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        Маршрут{' '}
                        {activeStats && (
                          <span className="text-sm" style={{ color: '#404823' }}>
                            на {(() => {
                              const wd = activeStats.dateObj.toLocaleDateString('ru-RU', { weekday: 'short' });
                              const wdCap = wd.charAt(0).toUpperCase() + wd.slice(1);
                              const dm = activeStats.dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                              return `${wdCap}, ${dm}`;
                            })()}
                          </span>
                        )}
                    </h3>



                    <div className="flex items-center gap-2 mt-1">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgb(224, 219, 206)', color: '#404823' }}>
                            <span>Ветер: {activeStats?.windDirFull} ({activeStats?.windRange} км/ч)</span>
                            <svg
                                style={{ transform: `rotate(${(activeStats?.windDeg || 0) + 180}deg)` }}
                                className="ml-1.5 w-3 h-3"
                                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <line x1="12" y1="19" x2="12" y2="5"></line>
                                <polyline points="5 12 12 5 19 12"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>

                {currentRouteData && (
                    <div className="flex gap-4 text-right">
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#b5b0a6' }}>ДИСТАНЦИЯ</span>
                            <span className="text-lg font-bold text-slate-700">{currentRouteData.distanceKm.toFixed(0)} <span className="text-sm font-normal">км</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#b5b0a6' }}>НАБОР</span>
                            <span className="text-lg font-bold text-slate-700">{Math.round(currentRouteData.elevationM)} <span className="text-sm font-normal">м</span></span>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                                <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#b5b0a6' }}>ТЕМП</span>
                                <span className="text-lg font-bold text-slate-700">30 <span className="text-sm font-normal">км/ч</span></span>
                        </div>
                        {activeStats?.rideDuration && (
                        <div className="flex flex-col items-center justify-center text-center">
                                <span className="text-xs uppercase font-semibold mb-1" style={{ color: '#b5b0a6' }}>В СЕДЛЕ</span>
                                <span className="text-lg font-bold text-slate-700">
                                    {activeStats.rideDuration}
                                </span>
                        </div>
                        )}
                    </div>
                )}
            </div>
            <div className="relative w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-100 z-0">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Route Switcher Buttons */}
                {foundRoutes.length > 1 && (
                    <div className="absolute bottom-4 left-4 z-[400] flex gap-2">
                        {foundRoutes.map((_, idx) => (
                             <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setSelectedRouteIdx(idx); }}
                                className={`h-8 px-3 rounded-lg text-sm font-bold shadow-sm transition-all ${selectedRouteIdx === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                             >
                                #{idx + 1}
                             </button>
                        ))}
                    </div>
                )}

                {/* Error/Empty State overlay */}
                {!currentRouteData && !isFlightDestination && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 backdrop-blur-[1px] z-[400]">
                         <span className="bg-[#4f6814] px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm">
                            {routeStatus}
                         </span>
                    </div>
                )}
            </div>
            {currentRouteData && (
              <div className="pt-3">
                <button
                  onClick={handleDownloadGpx}
                  className="flex items-center justify-center w-full p-3 bg-[#e3d2b4] text-[#404823] rounded-lg font-bold hover:bg-[#d1c0a2] transition-colors shadow-sm gap-2 text-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>Скачать GPX</span>
                </button>
              </div>
            )}
          </div>
          {activeStats && showTransportBlock && (
              <TransportBlock
                  startCity={routeStartCity} endCity={routeEndCity}
                  startCoords={{ lat: routeStartLat, lon: routeStartLon }}
                  endCoords={{ lat: routeEndLat, lon: routeEndLon }}
                  date={activeStats.dateObj} showTo={showTo} showFrom={showFrom}
              />
          )}
          <div className="flex flex-col gap-3">
            <a
              href={yandexMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                  if (mapInstanceRef.current && collectionFocusCoords) {
                      mapInstanceRef.current.setView([collectionFocusCoords.lat, collectionFocusCoords.lon], 13);
                  }
              }}
              className="flex items-center justify-center w-full p-4 bg-yellow-400 text-slate-900 rounded-lg font-bold hover:bg-yellow-500 transition-colors shadow-sm gap-2 text-center text-sm sm:text-base leading-tight"
            >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Хорошие места</span>
            </a>
            <a
              href="https://www.komoot.com/collection/2674102/-lechappe-belle?ref=collection"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full p-4 bg-[#4f6814] text-white rounded-lg font-bold hover:bg-[#4a5427] transition-colors shadow-sm gap-2 text-center text-sm sm:text-base leading-tight"
            >
                <svg
                    aria-hidden="true"
                    role="presentation"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 w-5 h-5"
                >
                    <path d="M8.40252 33.288C7.92483 33.7657 7.92217 34.5438 8.43188 34.9872C9.86413 36.233 11.4906 37.2409 13.2493 37.9694C15.3854 38.8542 17.6748 39.3096 19.9868 39.3096C22.2988 39.3096 24.5882 38.8542 26.7243 37.9694C28.483 37.2409 30.1095 36.233 31.5417 34.9872C32.0514 34.5438 32.0488 33.7657 31.5711 33.288L21.7167 23.4336C20.7613 22.4782 19.2123 22.4782 18.2569 23.4336L8.40252 33.288Z" fill="currentColor"></path>
                    <path d="M19.9442 0.634356C23.5265 0.63601 27.0377 1.6305 30.0832 3.50611C33.1286 5.38171 35.5878 8.06406 37.1845 11.252C38.7812 14.4399 39.4523 18.0072 39.1221 21.553C38.835 24.6363 37.8007 27.5971 36.1168 30.1857C35.7142 30.8045 34.8498 30.8647 34.3244 30.3461L26.3947 22.5191C26.0445 22.1734 25.9466 21.6539 26.0683 21.177C26.1878 20.7088 26.2545 20.2194 26.2614 19.7152C26.3091 16.2451 23.5178 13.3931 20.0268 13.3452C16.5359 13.2972 13.6672 16.0715 13.6196 19.5416C13.6117 20.1159 13.6816 20.6733 13.8196 21.2039C13.9447 21.6845 13.8464 22.2096 13.4916 22.5571L5.54627 30.3391C5.01997 30.8546 4.15787 30.7925 3.75642 30.1748C2.07248 27.5838 1.03897 24.6205 0.753588 21.5353C0.425571 17.9892 1.09894 14.4227 2.69756 11.2362C4.29617 8.04972 6.75681 5.3695 9.80337 3.49669C12.85 1.62389 16.3618 0.632706 19.9442 0.634356Z" fill="currentColor"></path>
                </svg>
                <span>Gastrodinamica в Komoot</span>
            </a>
          </div>
      </div>
    </div>
  );
};

export default CityDetail;