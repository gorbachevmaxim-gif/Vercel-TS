import * as React from 'react';

const GastrodinamikaLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Central Hook/Circle */}
      <path
        d="M100 115C108.284 115 115 108.284 115 100C115 91.7157 108.284 85 100 85C91.7157 85 85 91.7157 85 100C85 105 87 109 90 112"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Radiating Letters - Stylized representation of the text "GASTRODINAMIKA" */}
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {/* Г (Top Left) */}
        <path d="M75 80 L50 45 M50 45 L70 35" /> 
        
        {/* А */}
        <path d="M85 75 L85 25 M85 25 L100 25 M85 50 L100 50" /> 
        
        {/* С */}
        <path d="M100 75 L105 25 C120 25 125 40 115 50" /> 
        
        {/* Т */}
        <path d="M115 80 L135 30 M120 30 L150 35" /> 
        
        {/* Р */}
        <path d="M125 90 L160 55 C170 60 165 75 150 75 L135 85" /> 
        
        {/* О */}
        <path d="M130 100 L180 90 C185 105 175 115 160 110 L130 105" /> 
        
        {/* Д */}
        <path d="M125 115 L170 130 M170 130 L160 145 M170 130 L180 120" /> 
        
        {/* И */}
        <path d="M115 125 L140 160 M140 160 L155 145 M155 145 L150 170" /> 
        
        {/* Н */}
        <path d="M100 130 L100 175 M100 155 L115 155 M115 135 L115 170" /> 
        
        {/* А */}
        <path d="M85 125 L70 170 M70 170 L55 160 M65 150 L80 155" /> 
        
        {/* М */}
        <path d="M75 115 L40 145 L35 125 L50 110" /> 
        
        {/* И */}
        <path d="M70 100 L25 105 L30 90 L65 95" /> 
        
        {/* К */}
        <path d="M70 90 L30 75 M30 75 L45 60 M30 75 L40 85" /> 
        
        {/* А */}
        <path d="M72 85 L45 55 M45 55 L60 50 M50 65 L65 70" /> 
      </g>
    </svg>
  );
};

export default GastrodinamikaLogo;