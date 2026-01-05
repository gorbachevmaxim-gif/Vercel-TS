import * as React from 'react';

// Database of specific stations to improve routing accuracy
// ID is optional if name is unique enough for Yandex
const STATIONS = [
  { name: 'Большая Волга', id: 's9601720', lat: 56.723, lon: 37.143 },
  { name: 'Дубна', id: 's9600984', lat: 56.745, lon: 37.193 },
  { name: 'Голутвин', id: 's9600832', lat: 55.080, lon: 38.792 },
  { name: 'Коломна', id: 's9601262', lat: 55.102, lon: 38.761 },
  { name: '88 км', id: 's9601844', lat: 55.323, lon: 38.665 },
  { name: 'Воскресенск', id: 's9600709', lat: 55.316, lon: 38.681 },
  { name: 'Истра', id: 's9601053', lat: 55.914, lon: 36.857 },
  { name: 'Новоиерусалимская', id: 's9600742', lat: 55.925, lon: 36.840 },
  { name: 'Завидово', id: 's9603009', lat: 56.525, lon: 36.527 },
  { name: 'Серпухов', id: 's9600693', lat: 54.931, lon: 37.452 },
  { name: 'Звенигород', id: 's9601243', lat: 55.719, lon: 36.883 },
  { name: 'Можайск', id: 's9601678', lat: 55.495, lon: 36.035 },
  { name: 'Дмитров', id: 's9601815', lat: 56.345, lon: 37.514 },
  { name: 'Яхрома', id: 's9601247', lat: 56.287, lon: 37.489 },
  { name: 'Турист', id: 's9601874', lat: 56.242, lon: 37.498 },
  { name: 'Зеленоград-Крюково', id: 's9600692', lat: 55.980, lon: 37.172 },
  { name: 'Подсолнечная', id: 's9600720', lat: 56.182, lon: 36.974 },
  { name: 'Александров-1', id: 's9601440', lat: 56.394, lon: 38.729 },
  { name: 'Сергиев Посад', id: 's9600704', lat: 56.302, lon: 38.134 },
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

// Internal component for Yandex Raspisaniya Logo (SVG)
const YandexRaspLogo = () => (
  <div className="flex items-center gap-3 select-none">
    {/* Yandex 'Ya' Logo */}
    <div className="shrink-0 block" title="Яндекс">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
            <mask id="yandexLogoMask" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="25">
                <circle cx="12" cy="12.001" r="12" fill="#fff"/>
            </mask>
            <g mask="url(#yandexLogoMask)">
                <path fill="#FC3F1D" d="M0 .001h24v24H0z"/>
                <path fill="#fff" d="M13.77 6.721h-1.215c-2.082 0-3.123 1.041-3.123 2.603 0 1.735.694 2.602 2.255 3.643l1.215.868-3.47 5.378H6.656l3.296-4.858c-1.908-1.388-2.949-2.602-2.949-4.858 0-2.776 1.908-4.684 5.552-4.684h3.643v14.4H13.77V6.721Z"/>
            </g>
        </svg>
    </div>
    
    {/* Service Icon and Text */}
    <div className="flex items-center gap-2" title="Яндекс Расписания">
        <svg width="28" height="28" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 block">
            <path d="M12.848.807a12 12 0 1 1-12 12 12 12 0 0 1 12-12Z" fill="#FC0"/>
            <path d="m14.998 18.275-1.326 1.17-2.99 2.834h4.902l5.746-5.744-5.728-5.728H10.7l.056.052 1.256 1.11 2.992 2.838H1.018c.203 1.208.59 2.378 1.15 3.468h12.83Z" fill="url(#serviceLogoGrad)"/>
            <g filter="url(#serviceLogoFilter)">
                <path d="M10.1 14.807h4.904l-3-2.834-1.256-1.11-.07-.06h14a11.98 11.98 0 0 0-1.152-3.47H10.7l1.322-1.19 2.964-2.8h-4.902L4.356 9.07l5.744 5.738Z" fill="#fff"/>
            </g>
            <defs>
                <linearGradient id="serviceLogoGrad" x1="11.174" y1="22.279" x2="11.174" y2="10.807" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FC3F1D"/>
                    <stop offset="1" stopColor="#FF2700"/>
                </linearGradient>
                <filter id="serviceLogoFilter" x="3.727" y="2.923" width="21.162" height="12.304" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="-.21"/>
                    <feGaussianBlur stdDeviation=".21"/>
                    <feColorMatrix values="0 0 0 0 0.0509804 0 0 0 0 0.137255 0 0 0 0 0.262745 0 0 0 0.05 0"/>
                    <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_15_8407"/>
                    <feBlend in="SourceGraphic" in2="effect1_dropShadow_15_8407" result="shape"/>
                </filter>
            </defs>
        </svg>
        
        {/* Replaced Text with SVG Logo */}
        <svg 
            width="135" 
            height="21" 
            viewBox="0 0 343 53" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="text-slate-900 block mt-0.5"
        >
            <path 
                d="M.822.337V51.75h8.951V33.405h4.365c11.688 0 19.16-5.4 19.16-16.793C33.298 6.255 26.344.337 14.212.337H.822Zm13.39 26.114H9.773V7.29h4.735c6.288 0 9.69 2.885 9.69 9.32 0 6.733-3.772 9.84-9.986 9.84ZM65.193 26.377c0-9.025-4.587-12.428-13.908-12.428-5.844 0-10.43 1.849-13.094 3.403v7.323c2.367-1.775 7.546-3.698 12.058-3.698 4.217 0 6.14 1.479 6.14 5.474v2.071h-1.405c-13.464 0-19.456 4.439-19.456 11.985 0 7.545 4.587 11.762 11.392 11.762 5.179 0 7.398-1.702 9.1-3.477h.37c.074.962.37 2.22.665 2.96h8.582a93.66 93.66 0 0 1-.444-9.1V26.377ZM56.39 42.874c-1.11 1.627-3.181 2.959-6.289 2.959-3.698 0-5.548-2.22-5.548-5.548 0-4.365 3.033-5.919 10.579-5.919h1.258v8.508ZM88.25 52.49c4.069 0 6.954-.739 9.1-2.292v-7.176c-2.22 1.553-4.883 2.515-8.582 2.515-6.288 0-8.877-4.883-8.877-12.576 0-8.064 3.18-12.206 8.95-12.206 3.404 0 6.733 1.183 8.508 2.293v-7.472c-1.85-1.036-5.104-1.775-9.469-1.775-11.244 0-17.089 8.063-17.089 19.382 0 12.428 5.697 19.308 17.46 19.308ZM103.264 14.54v37.211h8.803V21.494h11.392v30.257h8.804v-37.21h-28.999ZM139.674 14.54v37.211h7.62l13.612-23.007v23.007h8.581v-37.21h-7.619l-13.612 23.006V14.54h-8.582ZM192.859 52.49c4.069 0 6.954-.739 9.099-2.292v-7.176c-2.219 1.553-4.882 2.515-8.581 2.515-6.288 0-8.878-4.883-8.878-12.576 0-8.064 3.181-12.206 8.952-12.206 3.403 0 6.732 1.183 8.507 2.293v-7.472c-1.849-1.036-5.104-1.775-9.469-1.775-11.245 0-17.089 8.063-17.089 19.382 0 12.428 5.696 19.308 17.459 19.308ZM235.327 26.377c0-9.025-4.587-12.428-13.908-12.428-5.844 0-10.431 1.849-13.094 3.403v7.323c2.367-1.775 7.546-3.698 12.058-3.698 4.217 0 6.14 1.479 6.14 5.474v2.071h-1.405c-13.464 0-19.456 4.439-19.456 11.985 0 7.545 4.586 11.762 11.392 11.762 5.179 0 7.398-1.702 9.099-3.477h.37c.074.962.37 2.22.666 2.96h8.581a93.944 93.944 0 0 1-.443-9.1V26.377Zm-8.804 16.497c-1.109 1.627-3.181 2.959-6.288 2.959-3.699 0-5.548-2.22-5.548-5.548 0-4.365 3.033-5.919 10.579-5.919h1.257v8.508ZM262.971 14.54v14.722h-11.763V14.54h-8.803v37.211h8.803V36.216h11.763V51.75h8.803v-37.21h-8.803ZM279.177 14.54v37.211h7.619l13.612-23.007v23.007h8.582v-37.21h-7.62l-13.612 23.006V14.54h-8.581ZM313.793 51.751h9.025l7.102-12.132h4.217V51.75h8.803v-37.21h-13.464c-8.581 0-14.721 4.364-14.721 12.354 0 5.622 2.663 9.173 7.398 10.8l-8.36 14.056Zm16.349-30.257h3.995v11.689h-4.217c-3.995 0-6.214-1.702-6.214-5.992 0-4.07 2.589-5.697 6.436-5.697Z"
                fill="currentColor"
            />
        </svg>
    </div>
  </div>
);

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

      // 1. Try to find exact station by coordinates
      const station = findNearestStation(coords);
      if (station) {
          return {
              apiName: station.name,
              displayName: station.name,
              provider: 'yandex',
              yandexId: station.id
          };
      }
      
      // 2. Fallback to hardcoded city overrides (legacy support)
      if (city === 'Воскресенск') return {
          apiName: '66 км', 
          displayName: '66 км',
          provider: 'yandex'
      };
      if (city === 'Коломна') return {
          apiName: 'Голутвин', 
          displayName: 'Голутвин',
          provider: 'yandex'
      };
      if (city === 'Дубна') return {
          apiName: 'Большая Волга', 
          displayName: 'Большая Волга',
          provider: 'yandex',
          yandexId: 's9601720' 
      };

      // 3. Fallback to City Name
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

  if (!showTo && !showFrom) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center border-b border-slate-100 pb-3">
        {/* Header Icon: Yandex Logo or Aeroflot Text */}
        <div className="shrink-0">
             {isAeroflot ? (
                 <span className="text-xl font-bold tracking-wider text-slate-700">АЭРОФЛОТ</span>
             ) : (
                 <YandexRaspLogo />
             )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Buttons */}
        <div className={`grid gap-3 ${showTo && showFrom ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {showTo && (
                <a 
                    href={toUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium uppercase mb-1">Туда</span>
                        <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Москва → {startConfig.displayName}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                        {isAeroflot ? (
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /> 
                        ) : (
                            <>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </>
                        )}
                    </svg>
                </a>
            )}

            {showFrom && (
                <a 
                    href={fromUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium uppercase mb-1">Обратно</span>
                        <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{endConfig.displayName} → Москва</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                        {isAeroflot ? (
                             <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" transform="rotate(180 12 12)" />
                        ) : (
                            <>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </>
                        )}
                    </svg>
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransportBlock;