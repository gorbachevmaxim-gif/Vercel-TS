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
  const dateStr = date.toISOString().split('T')[0];
  
  // Helper to build Yandex Raspisaniya URL
  const getScheduleUrl = (from: string, to: string) => {
    const params = new URLSearchParams({
      fromName: from,
      toName: to,
      when: dateStr,
      transport: 'suburban', // Only suburban trains (electrichka/express)
    });
    return `https://rasp.yandex.ru/search/?${params.toString()}`;
  };

  const toUrl = getScheduleUrl('Москва', startCity);
  const fromUrl = getScheduleUrl(endCity, 'Москва');

  if (!showTo && !showFrom) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center border-b border-slate-100 pb-3">
        {/* Yandex Raspisaniya Logo */}
        <div className="shrink-0">
             <img 
                src="/yandex_rasp_logo.png" 
                alt="Yandex Raspisaniya" 
                className="h-8 w-auto object-contain scale-90"
             />
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
                        <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Москва → {startCity}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
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
                        <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{endCity} → Москва</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransportBlock;