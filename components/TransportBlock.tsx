import * as React from 'react';

interface TransportBlockProps {
  startCity: string;
  endCity: string;
  date: Date;
  showTo?: boolean;
  showFrom?: boolean;
}

const TransportBlock: React.FC<TransportBlockProps> = ({ 
  startCity, 
  endCity, 
  date,
  showTo = true,
  showFrom = true
}) => {
  // Format date for Yandex URL (YYYY-MM-DD)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const dateStrYandex = `${year}-${month}-${day}`;
  const dateStrAeroflot = `${year}${month}${day}`;
  
  // Helper to resolve city mappings (e.g. Flight destinations)
  const getCityTransportConfig = (city: string) => {
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
      return { 
          apiName: city, 
          displayName: city, 
          provider: 'yandex' 
      };
  };

  const startConfig = getCityTransportConfig(startCity);
  const endConfig = getCityTransportConfig(endCity);

  const isAeroflot = startConfig.provider === 'aeroflot' || endConfig.provider === 'aeroflot';

  // Helper to build URLs based on provider
  const getUrl = (fromCodeOrName: string, toCodeOrName: string, provider: 'aeroflot' | 'yandex') => {
    if (provider === 'aeroflot') {
        // Aeroflot format: MOW.DLM.20231025
        return `https://www.aeroflot.ru/sb/app/ru-ru#/search?routes=${fromCodeOrName}.${toCodeOrName}.${dateStrAeroflot}&adults=1&children=0&infants=0&cabin=economy`;
    } else {
        // Yandex format
        const params = new URLSearchParams({
            fromName: fromCodeOrName,
            toName: toCodeOrName,
            when: dateStrYandex,
            transport: 'suburban', 
        });
        return `https://rasp.yandex.ru/search/?${params.toString()}`;
    }
  };

  // Logic: "To" means Moscow -> StartCity
  // If provider is Aeroflot, use codes (MOW -> API Code). Else use names.
  const toUrl = getUrl(
      isAeroflot ? 'MOW' : 'Москва', 
      startConfig.apiName, 
      startConfig.provider as 'aeroflot' | 'yandex'
  );

  // Logic: "From" means EndCity -> Moscow
  const fromUrl = getUrl(
      endConfig.apiName, 
      isAeroflot ? 'MOW' : 'Москва', 
      endConfig.provider as 'aeroflot' | 'yandex'
  );

  if (!showTo && !showFrom) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center border-b border-slate-100 pb-3">
        {/* Header Icon: Yandex Logo or Aeroflot Text */}
        <div className="shrink-0">
             {isAeroflot ? (
                 <span className="text-xl font-bold tracking-wider text-slate-700">АЭРОФЛОТ</span>
             ) : (
                 <img 
                    src="/yandex_rasp_logo.png" 
                    alt="Yandex Raspisaniya" 
                    className="h-8 w-auto object-contain scale-90"
                 />
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