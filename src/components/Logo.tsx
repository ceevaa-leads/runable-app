import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Logo component using the provided image with fallback
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const dimension = sizes[size];

  // If image fails to load, show a simple fallback
  if (imageError) {
    return (
      <div 
        className={`logo-fallback ${className}`}
        style={{
          width: dimension,
          height: dimension,
          background: 'linear-gradient(135deg, #3B5998 0%, #1E3A5F 100%)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: dimension * 0.4,
        }}
      >
        C
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="CeeVaa Logo"
      width={dimension}
      height={dimension}
      className={`logo-image ${className}`}
      style={{ objectFit: 'contain' }}
      onError={() => setImageError(true)}
    />
  );
};

export const LogoWithText: React.FC<LogoProps & { showTagline?: boolean }> = ({ 
  size = 'md', 
  className = '',
  showTagline = false 
}) => {
  return (
    <div className={`logo-container ${className}`}>
      <Logo size={size} />
      <div className="logo-text">
        <span className="logo-brand">CeeVaa</span>
        {showTagline && (
          <span className="logo-tagline">Lead Generation Platform</span>
        )}
      </div>
    </div>
  );
};
