import React, { useState } from 'react';
import logoImage from '../assets/images/learnlab_logo_1788341344137.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'badge';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'full',
}) => {
  const [imageLoaded, setImageLoaded] = useState(true);

  // Logo asset generated from the user's uploaded image
  const logoImageSrc = logoImage;

  const sizeClasses = {
    sm: {
      img: 'w-8 h-8',
      title: 'text-lg',
      tagline: 'text-[9px]',
    },
    md: {
      img: 'w-10 h-10',
      title: 'text-xl',
      tagline: 'text-[10px]',
    },
    lg: {
      img: 'w-14 h-14',
      title: 'text-2xl',
      tagline: 'text-xs',
    },
    xl: {
      img: 'w-24 h-24',
      title: 'text-4xl',
      tagline: 'text-sm',
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === 'badge') {
    return (
      <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shadow-sm border border-slate-100 ${currentSize.img} ${className}`}>
        {imageLoaded ? (
          <img
            src={logoImageSrc}
            alt="LearnLab Logo"
            className="w-full h-full object-cover"
            onError={() => setImageLoaded(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 flex items-center justify-center text-white font-black text-xs">
            LL
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative flex-shrink-0 rounded-xl overflow-hidden shadow-md shadow-indigo-100 bg-white p-0.5 border border-slate-100 ${currentSize.img}`}>
        {imageLoaded ? (
          <img
            src={logoImageSrc}
            alt="LearnLab Logo"
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImageLoaded(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-inner">
            🎓
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center select-none leading-tight">
        <div className={`font-bold tracking-tight text-slate-900 ${currentSize.title} flex items-center`}>
          <span>Learn</span>
          <span className="text-indigo-600">Lab</span>
        </div>
        {showTagline && (
          <p className={`font-bold tracking-widest text-indigo-600 uppercase ${currentSize.tagline} -mt-0.5`}>
            Study. Practice. Excel
          </p>
        )}
      </div>
    </div>
  );
};
