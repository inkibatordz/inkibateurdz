import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D9488" /> {/* Teal */}
            <stop offset="100%" stopColor="#DB2777" /> {/* Pink */}
          </linearGradient>
        </defs>
        
        {/* Circular border */}
        <path
          d="M30 150 A 85 85 0 1 1 170 150"
          stroke="url(#logoGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M30 155 A 85 85 0 0 0 170 155"
          stroke="url(#logoGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.5"
        />

        {/* 2TI Text - Styled */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="70"
          fontWeight="900"
          fill="url(#logoGradient)"
          style={{ fontFamily: 'sans-serif', letterSpacing: '-2px' }}
        >
          2TI
        </text>

        {/* Bottom Text Arc - Simulation using textPath if it were complex, 
            but for a component we can use a simple curved text approach or just centered text */}
        <text fontSize="12" fontWeight="bold" fill="#4B5563">
          <textPath href="#textPath" startOffset="50%" textAnchor="middle">
            TLEMCEN TECH INCUBATOR
          </textPath>
        </text>
        <path id="textPath" d="M 40 160 Q 100 200 160 160" fill="none" />
      </svg>
    </div>
  );
};

export default Logo;
