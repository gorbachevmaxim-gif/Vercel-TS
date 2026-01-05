import * as React from 'react';
import { Place } from '../types';
import { CITY_PLACES } from '../constants';

interface PlacesBlockProps {
  startCity: string;
  endCity: string;
  autoStartPlaces: Place[];
  autoEndPlaces: Place[];
  loading: boolean;
}

const PlacesBlock: React.FC<PlacesBlockProps> = ({ startCity, endCity, autoStartPlaces, autoEndPlaces, loading }) => {
  // 1. Get Curated Places from constants
  const getCuratedPlaces = (city: string): Place[] => {
      return CITY_PLACES[city] || [];
  };

  const curatedStart = getCuratedPlaces(startCity);
  const curatedEnd = getCuratedPlaces(endCity);

  // 2. Merge logic: Curated first, then Auto filled up to 3 items total per section
  // Note: We prioritize curated.
  const mergePlaces = (curated: Place[], auto: Place[]) => {
      // Create a set of curated names to avoid duplicates if OSM finds the same place
      const curatedNames = new Set(curated.map(p => p.name.toLowerCase()));
      
      const filteredAuto = auto.filter(p => !curatedNames.has(p.name.toLowerCase()));
      
      // Combine and slice
      return [...curated, ...filteredAuto].slice(0, 3);
  };

  const finalStartPlaces = mergePlaces(curatedStart, autoStartPlaces);
  const finalEndPlaces = mergePlaces(curatedEnd, autoEndPlaces);

  const isSameCity = startCity === endCity;
  
  if (finalStartPlaces.length === 0 && finalEndPlaces.length === 0 && !loading) return null;

  const renderPlaceCard = (place: Place, index: number, isCurated: boolean) => (
      <a 
          key={`${place.name}-${index}`}
          href={place.url ? place.url : `https://yandex.ru/maps/?text=${encodeURIComponent(place.name + ' ' + (place.address || ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all group ${isCurated ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}
      >
          <div className="flex justify-between items-start mb-1">
              <span className={`font-bold text-sm group-hover:text-amber-600 transition-colors line-clamp-1 ${isCurated ? 'text-amber-900' : 'text-slate-800'}`}>
                  {place.name}
              </span>
              {isCurated && (
                  <span title="Рекомендация" className="text-xs">⭐</span>
              )}
          </div>
          <span className="text-xs text-slate-500 font-medium mb-1 line-clamp-1">{place.type}</span>
          {place.address && (
              <span className="text-xs text-slate-400 truncate">{place.address}</span>
          )}
      </a>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
         <div className="flex items-center gap-2">
            <span className="text-xl">🍔</span>
            <h3 className="font-bold text-slate-800">Где поесть</h3>
         </div>
         {loading && <span className="text-xs text-slate-400 animate-pulse">Поиск вкусного...</span>}
      </div>

      <div className="space-y-6">
        {/* Start City Places */}
        {finalStartPlaces.length > 0 && (
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Старт: {startCity}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {finalStartPlaces.map((p, i) => renderPlaceCard(p, i, curatedStart.includes(p)))}
                </div>
            </div>
        )}

        {/* End City Places (only if different or if just filling space) */}
        {!isSameCity && finalEndPlaces.length > 0 && (
            <div>
                 {finalStartPlaces.length > 0 && <div className="border-t border-slate-100 my-4" />}
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    Финиш: {endCity}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {finalEndPlaces.map((p, i) => renderPlaceCard(p, i, curatedEnd.includes(p)))}
                </div>
            </div>
        )}

        {!loading && finalStartPlaces.length === 0 && finalEndPlaces.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-2">
                Рядом с маршрутом ничего не найдено :(
            </div>
        )}
      </div>
    </div>
  );
};

export default PlacesBlock;