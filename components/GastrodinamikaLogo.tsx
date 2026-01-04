import * as React from 'react';

interface LogoProps {
  percent?: number;
  className?: string;
}

const GastrodinamikaLogo: React.FC<LogoProps> = ({ percent = 0, className = "" }) => {
  // Используем JPG файл.
  // Файл должен находиться в папке public/ проекта.
  const logoSrc = "/gastrodinamika_ronde_novo.jpg";

  // Измененный угол старта: 293 градуса
  const startAngle = 293; 

  return (
    <div className={`relative ${className}`}>
       {/* 1. Фоновый слой (Серый) */}
       {/* opacity-20 делает черный логотип светло-серым.
           mix-blend-multiply убирает белый фон JPG (делает его прозрачным на светлом фоне),
           оставляя только темные линии.
       */}
       <img
         src={logoSrc}
         alt="Gastrodinamika Background"
         className="absolute inset-0 w-full h-full object-contain grayscale opacity-20 mix-blend-multiply"
       />

       {/* 2. Активный слой (Черный) */}
       {/* Сверху накладываем нормальный логотип, но обрезаем его маской */}
       <img
         src={logoSrc}
         alt="Gastrodinamika Active"
         className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
         style={{
           // Стандартное свойство
           maskImage: `conic-gradient(from ${startAngle}deg, black ${percent}%, transparent ${percent}%)`,
           // Префикс для Safari/Chrome
           WebkitMaskImage: `conic-gradient(from ${startAngle}deg, black ${percent}%, transparent ${percent}%)`
         }}
       />
    </div>
  );
};

export default GastrodinamikaLogo;