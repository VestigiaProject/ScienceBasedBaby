import React from 'react';
import logoSvg from '/images/logo.svg';
import logoGreySvg from '/images/logogrey.svg';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'grey';
}

export function Logo({ className = '', variant = 'default' }: LogoProps) {
  const logoSource = variant === 'grey' ? logoGreySvg : logoSvg;
  
  return (
    <img 
      src={logoSource} 
      className={className} 
      alt="Science Based Baby Logo"
    />
  );
}