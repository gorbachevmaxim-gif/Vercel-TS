import * as React from 'react';
import { Place } from '../types';
import { CITY_PLACES } from '../constants';

interface PlacesBlockProps {
  startCity: string;
  endCity: string;
}

const PlacesBlock: React.FC<PlacesBlockProps> = ({ startCity, endCity }) => {
  const getCuratedPlaces = (city: string): Place[] => {
      return CITY_PLACES[city] || [];
  };

  const startPlaces = getCuratedPlaces(startCity);
  const endPlaces = getCuratedPlaces(endCity);

  const isSameCity = startCity === endCity;
  const hasPlaces = startPlaces.length > 0 || endPlaces.length > 0;

  const renderPlaceCard = (place: Place, index: number) => (
      <a 
          key={`${place.name}-${index}`}
          href={place.url ? place.url : `https://yandex.ru/maps/?text=${encodeURIComponent(place.name + ' ' + (place.address || ''))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col p-3 bg-white border border-amber-200 rounded-lg shadow-sm hover:shadow-md transition-all group bg-amber-50/30"
      >
          <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-sm text-amber-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {place.name}
              </span>
              <span title="Рекомендация" className="text-xs">⭐</span>
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
      </div>

      <div className="space-y-6">
        {hasPlaces && (
            <>
                {startPlaces.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            Старт: {startCity}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {startPlaces.map((p, i) => renderPlaceCard(p, i))}
                        </div>
                    </div>
                )}

                {!isSameCity && endPlaces.length > 0 && (
                    <div>
                         {startPlaces.length > 0 && <div className="border-t border-slate-100 my-4" />}
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                            Финиш: {endCity}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {endPlaces.map((p, i) => renderPlaceCard(p, i))}
                        </div>
                    </div>
                )}
            </>
        )}

        {/* Global Yandex Collection Link */}
        <div className={`${hasPlaces ? 'pt-2 border-t border-slate-100' : ''}`}>
             <a 
                href="https://yandex.ru/maps?bookmarks%5BpublicId%5D=OfCmg0o9&utm_source=share&utm_campaign=bookmarks"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full p-4 bg-yellow-400 text-slate-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors shadow-sm gap-2"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Коллекция Gastrodinamica на Яндекс.Картах</span>
             </a>
             <p className="text-xs text-slate-500 text-center mt-2">
                 Полный список проверенных мест доступен в нашей подборке
             </p>
        </div>
      </div>
    </div>
  );
};

export default PlacesBlock;