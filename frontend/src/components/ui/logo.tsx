import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'w-6 h-6', text: 'text-lg', container: 'gap-2' },
  md: { icon: 'w-8 h-8', text: 'text-xl', container: 'gap-3' },
  lg: { icon: 'w-10 h-10', text: 'text-2xl', container: 'gap-3' },
  xl: { icon: 'w-12 h-12', text: 'text-3xl', container: 'gap-4' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = ''
}) => {
  const config = sizeConfig[size];

  const RobotIcon = () => (
    <div className={`${config.icon} relative`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea2804" />
            <stop offset="100%" stopColor="#dd4425" />
          </linearGradient>
          <linearGradient id="documentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dd4425" />
            <stop offset="100%" stopColor="#c2185b" />
          </linearGradient>
        </defs>

        <rect x="8" y="12" width="32" height="28" rx="8" fill="url(#robotGradient)" />
        <rect x="12" y="8" width="24" height="8" rx="4" fill="url(#robotGradient)" opacity="0.8" />

        <circle cx="18" cy="22" r="3" fill="white" />
        <circle cx="30" cy="22" r="3" fill="white" />
        <circle cx="18" cy="22" r="1.5" fill="#ea2804" />
        <circle cx="30" cy="22" r="1.5" fill="#ea2804" />

        <rect x="20" y="28" width="8" height="4" rx="2" fill="white" opacity="0.9" />

        <rect x="34" y="18" width="10" height="12" rx="2" fill="url(#documentGradient)" opacity="0.9" />
        <rect x="36" y="21" width="6" height="1" fill="white" opacity="0.8" />
        <rect x="36" y="24" width="4" height="1" fill="white" opacity="0.8" />
        <rect x="36" y="27" width="5" height="1" fill="white" opacity="0.8" />

        <circle cx="20" cy="6" r="2" fill="url(#robotGradient)" opacity="0.7" />
        <circle cx="28" cy="6" r="2" fill="url(#robotGradient)" opacity="0.7" />
        <line x1="20" y1="8" x2="20" y2="10" stroke="url(#robotGradient)" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="8" x2="28" y2="10" stroke="url(#robotGradient)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  const LogoText = () => (
    <span
      className={`${config.text} font-bold text-[#202020]`}
      style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
    >
      DocPal
    </span>
  );

  if (variant === 'icon-only') {
    return <div className={className}><RobotIcon /></div>;
  }

  if (variant === 'text-only') {
    return <div className={className}><LogoText /></div>;
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      <RobotIcon />
      <LogoText />
    </div>
  );
};

export const LogoDark: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = ''
}) => {
  const config = sizeConfig[size];

  const RobotIconDark = () => (
    <div className={`${config.icon} relative`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="robotGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ea2804" />
            <stop offset="100%" stopColor="#dd4425" />
          </linearGradient>
          <linearGradient id="documentGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dd4425" />
            <stop offset="100%" stopColor="#c2185b" />
          </linearGradient>
        </defs>

        <rect x="8" y="12" width="32" height="28" rx="8" fill="url(#robotGradientDark)" />
        <rect x="12" y="8" width="24" height="8" rx="4" fill="url(#robotGradientDark)" opacity="0.8" />

        <circle cx="18" cy="22" r="3" fill="white" />
        <circle cx="30" cy="22" r="3" fill="white" />
        <circle cx="18" cy="22" r="1.5" fill="#ea2804" />
        <circle cx="30" cy="22" r="1.5" fill="#ea2804" />

        <rect x="20" y="28" width="8" height="4" rx="2" fill="white" opacity="0.9" />

        <rect x="34" y="18" width="10" height="12" rx="2" fill="url(#documentGradientDark)" opacity="0.9" />
        <rect x="36" y="21" width="6" height="1" fill="white" opacity="0.8" />
        <rect x="36" y="24" width="4" height="1" fill="white" opacity="0.8" />
        <rect x="36" y="27" width="5" height="1" fill="white" opacity="0.8" />

        <circle cx="20" cy="6" r="2" fill="url(#robotGradientDark)" opacity="0.7" />
        <circle cx="28" cy="6" r="2" fill="url(#robotGradientDark)" opacity="0.7" />
        <line x1="20" y1="8" x2="20" y2="10" stroke="url(#robotGradientDark)" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="8" x2="28" y2="10" stroke="url(#robotGradientDark)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );

  const LogoTextDark = () => (
    <span
      className={`${config.text} font-bold text-white`}
      style={{ fontFamily: "'Space Grotesk', 'Noto Sans SC', sans-serif" }}
    >
      DocPal
    </span>
  );

  if (variant === 'icon-only') {
    return <div className={className}><RobotIconDark /></div>;
  }

  if (variant === 'text-only') {
    return <div className={className}><LogoTextDark /></div>;
  }

  return (
    <div className={`flex items-center ${config.container} ${className}`}>
      <RobotIconDark />
      <LogoTextDark />
    </div>
  );
};

export default Logo;
