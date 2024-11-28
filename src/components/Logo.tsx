import React from 'react';
import logoPng from '/images/logo.png';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <img 
      src={logoPng} 
      className={className} 
      alt="Science Based Baby Logo"
    />
  );
}