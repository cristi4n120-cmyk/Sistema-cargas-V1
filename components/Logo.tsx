
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  white?: boolean;
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 180, white = false, variant = 'full' }) => {
  const colorPrimary = white ? "#FFFFFF" : "rgb(var(--color-brand-navy))";
  const colorAccent = "rgb(var(--color-brand-accent))"; 
  
  const isIcon = variant === 'icon';
  
  // ViewBox ajustado para o novo formato mais largo e "caído"
  const viewBox = isIcon ? "0 0 100 100" : "0 0 320 80";
  
  const width = size;
  const height = isIcon ? size : size * 0.25; 

  return (
    <div className={`relative inline-flex flex-col items-start ${className}`} style={{ width, height: 'auto' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={viewBox}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        style={{
            '--color-primary': colorPrimary,
            '--color-accent': colorAccent
        } as React.CSSProperties}
      >
        <defs>
          <linearGradient id="mageGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
          
          <filter id="arcaneGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <style>
            {`
              @keyframes drawMage {
                0% { stroke-dashoffset: 400; opacity: 0; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
              @keyframes pulseGem {
                0%, 100% { filter: drop-shadow(0 0 2px var(--color-accent)); transform: scale(1); }
                50% { filter: drop-shadow(0 0 8px var(--color-accent)); transform: scale(1.1); }
              }
              @keyframes floatHat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              @keyframes drawText {
                0% { stroke-dashoffset: 500; fill: transparent; opacity: 0; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; fill: var(--color-primary); opacity: 1; }
              }
              .mage-outline {
                stroke-dasharray: 400;
                animation: drawMage 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                stroke-linecap: round;
                stroke-linejoin: round;
              }
              .mage-float {
                animation: floatHat 6s ease-in-out infinite;
                transform-origin: center;
              }
              .gesla-text {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-weight: 900;
                font-size: 52px;
                letter-spacing: -0.04em;
                stroke: var(--color-primary);
                stroke-width: 0.5px;
                stroke-dasharray: 500;
                animation: drawText 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
              }
            `}
          </style>
        </defs>

        {/* --- THE REAL WIZARD HAT (Baseado na Referência) --- */}
        <g transform={isIcon ? "translate(5, 5) scale(0.9)" : "translate(10, -10) scale(0.9)"} className="mage-float">
          
          {/* 1. VOLUME FILL (Corpo etéreo) */}
          {/* Mesma forma do contorno, mas fechado para gradiente */}
          <path 
            d="M 10 75 Q 50 92 90 75 Q 85 65 70 65 L 65 65 C 60 40, 55 25, 45 15 C 35 5, 10 25, 12 38 Q 20 30, 32 38 C 35 50, 30 60, 30 65 Q 20 65 10 75 Z" 
            fill="url(#mageGradient)" 
            style={{ opacity: 0.6 }}
          />

          {/* 2. SILHUETA PRINCIPAL (Traço forte) */}
          {/* 
             Lógica do desenho:
             - Começa na ponta esquerda da aba (10, 75)
             - Faz a curva da aba inferior até a direita (90, 75)
             - Sobe para a copa pelo lado direito, inclinando para a esquerda (65, 65 -> 45, 15)
             - Faz a curva da ponta caída (The Droop) voltando para a esquerda e baixo (12, 38)
             - Faz a dobra da ponta (The Fold) (32, 38)
             - Desce pelo lado esquerdo da copa até a aba (30, 65)
             - Fecha a aba superior esquerda
          */}
          <path 
            d="M 10 75 Q 50 92 90 75 M 88 73 C 80 65, 75 65, 65 65 C 62 45, 55 25, 45 15 C 35 5, 10 25, 12 38 Q 20 30, 32 38 C 35 55, 28 62, 30 65 C 20 65, 15 68, 10 75" 
            stroke="var(--color-primary)" 
            strokeWidth="3.5" 
            fill="none"
            className="mage-outline"
            filter="url(#arcaneGlow)"
          />

          {/* 3. DETALHES INTERNOS (Dobras & Faixa) */}
          
          {/* Faixa do Chapéu (Band) - Curva na base da copa */}
          <path 
            d="M 31 62 Q 48 70 64 62" 
            stroke="var(--color-accent)" 
            strokeWidth="2.5" 
            fill="none"
            className="mage-outline"
            style={{ animationDelay: '0.4s', opacity: 0.9 }}
          />

          {/* Dobra da Ponta (Crease) - Dá volume ao "bico" caído */}
          <path 
            d="M 32 38 Q 38 42 36 50" 
            stroke="var(--color-primary)" 
            strokeWidth="1.5" 
            fill="none"
            className="mage-outline"
            style={{ animationDelay: '0.6s', opacity: 0.5 }}
          />

          {/* Dobra da Aba (Brim Fold) - Pequeno detalhe na direita */}
          <path 
            d="M 85 72 Q 80 75 75 72" 
            stroke="var(--color-primary)" 
            strokeWidth="1.5" 
            fill="none"
            className="mage-outline"
            style={{ animationDelay: '0.7s', opacity: 0.3 }}
          />

          {/* 4. THE EYE (Núcleo Mágico) */}
          {/* Pequeno ponto de luz na faixa */}
          <circle 
            cx="48" 
            cy="66" 
            r="3" 
            fill="var(--color-accent)" 
            className="mage-gem"
            style={{ animation: 'pulseGem 3s infinite ease-in-out' }} 
          />

        </g>

        {/* --- TEXT MARK (Full Variant) --- */}
        {!isIcon && (
          <>
            <text x="110" y="65" className="gesla-text">LOGIC</text>
            {/* Decorative Dot */}
            <circle cx="285" cy="52" r="3.5" fill="var(--color-accent)" className="animate-pulse" />
          </>
        )}
      </svg>
      
      {!white && !isIcon && (
        <div className="flex items-center gap-2 mt-[-5px] ml-[112px] animate-[fadeIn_1s_ease-out_1s_forwards] opacity-0">
          <div className="h-0.5 w-8 bg-gradient-to-r from-brand-accent to-transparent rounded-full"></div>
          <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400">
            Logistics Sorcery
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
