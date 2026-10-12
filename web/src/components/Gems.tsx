import React from 'react';

interface GemProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const GemDiamond: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="gemViolet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="facetTop" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E879F9" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="facetLeft" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="facetRight" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    {/* Table / Top Facet */}
    <polygon points="6,3 18,3 22,9 2,9" fill="url(#facetTop)" />
    {/* Crown facets */}
    <polygon points="2,9 12,21 6,9" fill="url(#facetLeft)" />
    <polygon points="6,9 12,21 18,9" fill="url(#gemViolet)" />
    <polygon points="18,9 12,21 22,9" fill="url(#facetRight)" />
    {/* Girdle highlights */}
    <line x1="2" y1="9" x2="22" y2="9" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.75" />
    <line x1="12" y1="3" x2="12" y2="21" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="0.5" />
  </svg>
);

export const GemShield: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="shieldMint" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#2DD4BF" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="shieldShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <path d="M12 2L3 6V12C3 17.5 7 21.5 12 22C17 21.5 21 17.5 21 12V6L12 2Z" fill="url(#shieldMint)" />
    <path d="M12 2L3 6V12C3 17.5 7 21.5 12 22V2Z" fill="url(#shieldShine)" />
    <path d="M12 5L6 8.5V12C6 15.5 8.5 18.5 12 19V5Z" fill="#FFFFFF" fillOpacity="0.25" />
    <path d="M12 2L21 6V12C21 17.5 17 21.5 12 22" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="0.75" />
  </svg>
);

export const GemRisk: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="riskMag" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#BE185D" />
      </linearGradient>
      <linearGradient id="riskFacet" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FB7185" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="url(#riskMag)" />
    <polygon points="12,2 22,8 12,12 2,8" fill="url(#riskFacet)" />
    <polygon points="2,8 12,12 12,22 2,16" fill="#000000" fillOpacity="0.2" />
    <polygon points="22,8 12,12 12,22 22,16" fill="#FFFFFF" fillOpacity="0.15" />
    <circle cx="12" cy="12" r="2" fill="#FFFFFF" fillOpacity="0.8" />
  </svg>
);

export const GemBudget: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="budgetGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="goldFacet" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="url(#budgetGold)" />
    <polygon points="12,2 21,7 12,12 3,7" fill="url(#goldFacet)" />
    <polygon points="3,7 12,12 12,22 3,17" fill="#B45309" fillOpacity="0.3" />
    <polygon points="21,7 12,12 12,22 21,17" fill="#FEF3C7" fillOpacity="0.25" />
    <path d="M12 6V18M9 9H15M9 15H15" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.8" />
  </svg>
);

export const GemPolicy: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="policyCyan" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
    </defs>
    <polygon points="7,2 17,2 21,6 21,20 17,22 7,22 3,18 3,6" fill="url(#policyCyan)" />
    <polygon points="7,2 17,2 19,7 5,7" fill="#A5F3FC" fillOpacity="0.8" />
    <line x1="6" y1="11" x2="18" y2="11" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="6" y1="15" x2="14" y2="15" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="6" y1="19" x2="11" y2="19" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const GemAudit: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="auditViolet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D8B4FE" />
        <stop offset="50%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#6B21A8" />
      </linearGradient>
    </defs>
    <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" fill="url(#auditViolet)" />
    <polygon points="12,3 20,8 12,12 4,8" fill="#F3E8FF" fillOpacity="0.6" />
    {/* Linked chain link */}
    <circle cx="9" cy="14" r="2.5" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
    <circle cx="15" cy="14" r="2.5" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
    <line x1="11" y1="14" x2="13" y2="14" stroke="#FFFFFF" strokeWidth="1.5" />
  </svg>
);

export const GemCpu: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="cpuBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="14" height="14" rx="3" fill="url(#cpuBlue)" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" fill="#FFFFFF" fillOpacity="0.3" />
    <line x1="8" y1="1" x2="8" y2="5" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="12" y1="1" x2="12" y2="5" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="16" y1="1" x2="16" y2="5" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="8" y1="19" x2="8" y2="23" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="23" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="16" y1="19" x2="16" y2="23" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="1" y1="8" x2="5" y2="8" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="1" y1="12" x2="5" y2="12" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="1" y1="16" x2="5" y2="16" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="8" x2="23" y2="8" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="23" y2="12" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="16" x2="23" y2="16" stroke="#A5B4FC" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const GemTerminal: React.FC<GemProps> = ({ className = '', size = 20, glow = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block transition-transform duration-200 ${glow ? 'filter drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="termGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2DD4BF" />
        <stop offset="50%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="16" rx="2" fill="url(#termGrad)" />
    <path d="M7 8L11 12L7 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="13" y1="16" x2="17" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
