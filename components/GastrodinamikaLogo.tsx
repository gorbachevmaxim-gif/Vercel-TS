import * as React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  percent?: number;
}

const GastrodinamikaLogo: React.FC<LogoProps> = ({ percent = 100, ...props }) => {
  // Letters paths in clockwise order starting from Г
  // Total 14 letters: Г А С Т Р О Д И Н А М И К А
  const letters = [
    // Г (Top Left)
    <path key="0" d="M75 80 L50 45 M50 45 L70 35" />,
    // А
    <path key="1" d="M85 75 L85 25 M85 25 L100 25 M85 50 L100 50" />,
    // С
    <path key="2" d="M100 75 L105 25 C120 25 125 40 115 50" />,
    // Т
    <path key="3" d="M115 80 L135 30 M120 30 L150 35" />,
    // Р
    <path key="4" d="M125 90 L160 55 C170 60 165 75 150 75 L135 85" />,
    // О
    <path key="5" d="M130 100 L180 90 C185 105 175 115 160 110 L130 105" />,
    // Д
    <path key="6" d="M125 115 L170 130 M170 130 L160 145 M170 130 L180 120" />,
    // И
    <path key="7" d="M115 125 L140 160 M140 160 L155 145 M155 145 L150 170" />,
    // Н
    <path key="8" d="M100 130 L100 175 M100 155 L115 155 M115 135 L115 170" />,
    // А
    <path key="9" d="M85 125 L70 170 M70 170 L55 160 M65 150 L80 155" />,
    // М
    <path key="10" d="M75 115 L40 145 L35 125 L50 110" />,
    // И
    <path key="11" d="M70 100 L25 105 L30 90 L65 95" />,
    // К
    <path key="12" d="M70 90 L30 75 M30 75 L45 60 M30 75 L40 85" />,
    // А
    <path key="13" d="M72 85 L45 55 M45 55 L60 50 M50 65 L65 70" />
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Central Hook/Circle - Always Active (Black) as the hub */}
      <path
        d="M100 115C108.284 115 115 108.284 115 100C115 91.7157 108.284 85 100 85C91.7157 85 85 91.7157 85 100C85 105 87 109 90 112"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Radiating Letters */}
      <g strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {letters.map((letterNode, index) => {
          // Calculate if this letter should be active based on percentage
          // 14 letters total.
          // letter 0 activates at > 0%
          // letter 13 activates at near 100%
          const threshold = (index / letters.length) * 100;
          const isActive = percent > threshold;

          return React.cloneElement(letterNode, {
            // Use currentColor (black from parent) if active, else light gray
            stroke: isActive ? 'currentColor' : '#e2e8f0', // slate-200
            className: 'transition-colors duration-300'
          });
        })}
      </g>
    </svg>
  );
};

export default GastrodinamikaLogo;