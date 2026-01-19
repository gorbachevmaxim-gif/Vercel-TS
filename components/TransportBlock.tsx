import * as React from 'react';
import YandexIcon from './YandexIcon';

// Database of specific stations to improve routing accuracy
// ID is optional if name is unique enough for Yandex
const STATIONS = [
  { name: 'Большая Волга', id: 's9601720', lat: 56.723, lon: 37.143 },
  { name: 'Дубна', id: 's9600984', lat: 56.745, lon: 37.193 },
  { name: 'Голутвин', id: 's9600716', lat: 55.080, lon: 38.792 },
  { name: 'Коломна', id: 's9601262', lat: 55.102, lon: 38.761 },
  { name: '88 км', id: 's9601844', lat: 55.323, lon: 38.665 },
  { name: 'Воскресенск', id: 's9600709', lat: 55.316, lon: 38.681 },
  { name: 'Истра', id: 's9601053', lat: 55.914, lon: 36.857 },
  { name: 'Новоиерусалимская', id: 's9600742', lat: 55.925, lon: 36.840 },
  { name: 'Завидово', id: '9602593', lat: 56.525, lon: 36.527 },
  { name: 'Серпухов', id: 's9600830', lat: 54.931, lon: 37.452 },
  { name: 'Звенигород', id: 's9601368', lat: 55.719, lon: 36.883 },
  { name: 'Можайск', id: 's9601006', lat: 55.495, lon: 36.035 },
  { name: 'Дмитров', id: 's9601815', lat: 56.345, lon: 37.514 },
  { name: 'Яхрома', id: 's9737523', lat: 56.287, lon: 37.489 },
  { name: 'Турист', id: 's9601874', lat: 56.242, lon: 37.498 },
  { name: 'Зеленоград-Крюково', id: 's9600212', lat: 55.980, lon: 37.172 },
  { name: 'Подсолнечная', id: 's9603468', lat: 56.182, lon: 36.974 },
  { name: 'Александров-1', id: 's9601547', lat: 56.394, lon: 38.729 },
  { name: 'Сергиев Посад', id: 's9601389', lat: 56.302, lon: 38.134 },
];

interface TransportBlockProps {
  startCity: string;
  endCity: string;
  startCoords?: { lat: number; lon: number };
  endCoords?: { lat: number; lon: number };
  date: Date;
  showTo?: boolean;
  showFrom?: boolean;
}

// Distance calc helper (Haversine)
const getDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const TransportBlock: React.FC<TransportBlockProps> = ({ 
  startCity, 
  endCity, 
  startCoords,
  endCoords,
  date,
  showTo = true,
  showFrom = true
}) => {
  // Format date for Yandex URL (YYYY-MM-DD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateStrYandex = `${year}-${month}-${day}`;
  // Aeroflot expects YYYYMMDD in the routes parameter (e.g. MOW.20260117.AYT)
  const dateStrAeroflot = `${year}${month}${day}`;

  // Find nearest station if coords provided
  const findNearestStation = (coords?: { lat: number; lon: number }) => {
      if (!coords) return null;
      let closest = null;
      let minD = Infinity;
      
      for (const st of STATIONS) {
          const d = getDist(coords.lat, coords.lon, st.lat, st.lon);
          if (d < minD) {
              minD = d;
              closest = st;
          }
      }

      // Only use if within 5km, otherwise fallback to city name
      if (closest && minD < 5) {
          return closest;
      }
      return null;
  };
  
  // Helper to resolve city mappings (e.g. Flight destinations or specific train stations)
  const getCityTransportConfig = (city: string, coords?: { lat: number; lon: number }) => {
      // 1. Overrides for Flight Destinations
      if (city === 'Фетхие') return { 
          apiName: 'DLM', // Aeroflot Airport Code for Dalaman
          displayName: 'Даламан', 
          provider: 'aeroflot' 
      };
      if (city === 'Кемер') return { 
          apiName: 'AYT', // Aeroflot Airport Code for Antalya
          displayName: 'Анталья', 
          provider: 'aeroflot' 
      };

      // 2. Manual Overrides for Train Stations (Prioritized over GPS)
      if (city === 'Воскресенск') return {
          apiName: '88 км', 
          displayName: '88 км',
          provider: 'yandex',
          yandexId: 's9601903'
      };
      if (city === 'Коломна') return {
          apiName: 'Голутвин', 
          displayName: 'Голутвин',
          provider: 'yandex',
          yandexId: 's9600716'
      };
      if (city === 'Дубна') return {
          apiName: 'Большая Волга', 
          displayName: 'Большая Волга',
          provider: 'yandex',
          yandexId: 's9601720' 
      };
      if (city === 'Павловский Посад') return {
          apiName: 'Павловский Посад',
          displayName: 'Павловский Посад',
          provider: 'yandex',
          yandexId: 's9601872'
      };
      if (city === 'Завидово') return {
          apiName: 'Новозавидовский',
          displayName: 'Новозавидовский',
          provider: 'yandex',
          yandexId: 'c22478'
      };
      if (city === 'Жуковский') return {
          apiName: 'Отдых',
          displayName: 'Отдых',
          provider: 'yandex',
          yandexId: 'c20571'
      };


      // 3. Try to find exact station by coordinates
      const station = findNearestStation(coords);
      if (station) {
          return { 
              apiName: station.name,
              displayName: station.name,
              provider: 'yandex',
              yandexId: station.id
          };
      }
      
      // 4. Fallback to City Name
      return { 
          apiName: city, 
          displayName: city, 
          provider: 'yandex' 
      };
  };

  const startConfig = getCityTransportConfig(startCity, startCoords);
  const endConfig = getCityTransportConfig(endCity, endCoords);
  
  const moscowConfig = {
      apiName: 'Москва',
      displayName: 'Москва',
      provider: 'yandex',
      yandexId: 'c213'
  };

  const isAeroflot = startConfig.provider === 'aeroflot' || endConfig.provider === 'aeroflot';

  // Helper to build URLs based on provider
  const getUrl = (fromConfig: any, toConfig: any) => {
    const provider = (fromConfig.provider === 'aeroflot' || toConfig.provider === 'aeroflot') ? 'aeroflot' : 'yandex';

    if (provider === 'aeroflot') {
        // Aeroflot format: routes=ORIGIN.YYYYMMDD.DESTINATION
        const fromCode = fromConfig.apiName === 'Москва' ? 'MOW' : fromConfig.apiName;
        const toCode = toConfig.apiName === 'Москва' ? 'MOW' : toConfig.apiName;
        return `https://www.aeroflot.ru/sb/app/ru-ru#/search?adults=1&cabin=economy&children=0&childrenaward=0&childrenfrgn=0&infants=0&routes=${fromCode}.${dateStrAeroflot}.${toCode}`;
    } else {
        // Yandex format for suburban trains
        const params = new URLSearchParams();
        
        if (fromConfig.yandexId) params.append('fromId', fromConfig.yandexId);
        params.append('fromName', fromConfig.apiName);
        
        if (toConfig.yandexId) params.append('toId', toConfig.yandexId);
        params.append('toName', toConfig.apiName);
        
        params.append('when', dateStrYandex);
        
        return `https://rasp.yandex.ru/search/suburban/?${params.toString()}`;
    }
  };

  // Logic: "To" means Moscow -> StartCity
  const toUrl = getUrl(moscowConfig, startConfig);

  // Logic: "From" means EndCity -> Moscow
  const fromUrl = getUrl(endConfig, moscowConfig);
  const toStationName = `${moscowConfig.displayName} → ${startConfig.displayName}`;
  const fromStationName = `${endConfig.displayName} → ${moscowConfig.displayName}`;

  if (!showTo && !showFrom) return null;

  return (
    <div className="bg-white rounded-full p-5 space-y-4">
      <div className="space-y-3">
        {/* Buttons */}
        <div className={`grid gap-3 ${showTo && showFrom ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {showTo && (
                <a 
                    href={toUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white border border-2 border-[#edebe5] rounded-full hover-border-3px hover:border-[#4f6814] transition-all group"
                >
                    <div className="flex flex-col pr-6">
                        <span className="text-xs font-medium uppercase mb-1" style={{ color: '#404823' }}>Туда</span>
                        <span className="font-nunito text-[15px]">{toStationName}</span>
                    </div>
                    <YandexIcon idSuffix="to" />
                </a>
            )}

            {showFrom && (
                <a 
                    href={fromUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white border border-2 border-[#edebe5] rounded-full hover-border-3px hover:border-[#4f6814] transition-all group"
                >
                    <div className="flex flex-col pr-6">
                        <span className="text-xs font-medium uppercase mb-1" style={{ color: '#404823' }}>Обратно</span>
                        <span className="font-nunito text-[15px]">{fromStationName}</span>
                    </div>
                    <YandexIcon idSuffix="from" />
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransportBlock;
