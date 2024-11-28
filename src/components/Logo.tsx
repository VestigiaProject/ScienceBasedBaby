import React from 'react';
import logoSvg from '/images/logo.svg';

interface LogoProps {
  className?: string;
  color?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <img 
      src={logoSvg} 
      className={className} 
      alt="Science Based Baby Logo"
    />
  );
}