import * as React from 'react';

interface LogoProps {
  percent?: number;
  className?: string;
}

const GastrodinamikaLogo: React.FC<LogoProps> = ({ percent = 0, className = "" }) => {
  // Используем приложенный файл gastrodinamika_ronde_novo.png
  // Файл должен находиться в папке public/ проекта.
  const logoSrc = "/gastrodinamika_ronde_novo.png";

  return (
    <div className={`relative ${className}`}>
       {/* 1. Фоновый слой (Серый) */}
       {/* opacity-20 делает черный логотип светло-серым */}
       <img
         src={logoSrc}
         alt="Gastrodinamika Background"
         className="absolute inset-0 w-full h-full object-contain grayscale opacity-20"
       />

       {/* 2. Активный слой (Черный) */}
       {/* Сверху накладываем нормальный логотип, но обрезаем его маской */}
       {/* conic-gradient(from 315deg...) начинает заливку с верхнего левого угла (буква Г) по часовой стрелке */}
       <img
         src={logoSrc}
         alt="Gastrodinamika Active"
         className="absolute inset-0 w-full h-full object-contain"
         style={{
           // Стандартное свойство
           maskImage: `conic-gradient(from 315deg, black ${percent}%, transparent ${percent}%)`,
           // Префикс для Safari/Chrome
           WebkitMaskImage: `conic-gradient(from 315deg, black ${percent}%, transparent ${percent}%)`
         }}
       />
    </div>
  );
};

export default GastrodinamikaLogo;