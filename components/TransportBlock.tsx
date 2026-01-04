import * as React from 'react';

interface TransportBlockProps {
  cityName: string;
  date: Date;
}

const TransportBlock: React.FC<TransportBlockProps> = ({ cityName, date }) => {
  // Format date for Yandex URL (YYYY-MM-DD)
  const dateStr = date.toISOString().split('T')[0];
  
  // Helper to build Yandex Raspisaniya URL
  const getScheduleUrl = (from: string, to: string) => {
    const params = new URLSearchParams({
      fromName: from,
      toName: to,
      when: dateStr,
    });
    return `https://rasp.yandex.ru/search/?${params.toString()}`;
  };

  const toUrl = getScheduleUrl('Москва', cityName);
  const fromUrl = getScheduleUrl(cityName, 'Москва');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            {/* Train Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
                <path d="M2 8h20"></path>
                <path d="M3.5 13.5l1.5-1.5 1.5 1.5"></path>
                <path d="M17.5 13.5l1.5-1.5 1.5 1.5"></path>
            </svg>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">Как добраться (Ж/Д)</h3>
            <p className="text-xs text-slate-500">Электрички, МЦД, Экспрессы</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Рекомендуемый интервал движения: <span className="font-bold text-slate-800">07:00 – 19:00</span></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
                href={toUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all group"
            >
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium uppercase mb-1">Туда</span>
                    <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Москва → {cityName}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </a>

            <a 
                href={fromUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:shadow-md transition-all group"
            >
                <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-medium uppercase mb-1">Обратно</span>
                    <span className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">{cityName} → Москва</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-red-500">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </a>
        </div>
      </div>
    </div>
  );
};

export default TransportBlock;