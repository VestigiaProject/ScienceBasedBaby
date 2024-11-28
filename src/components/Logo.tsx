import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

export function Logo({ className = '', color = 'currentColor' }: LogoProps) {
  // Replace the content between the <svg> tags with your logo.svg content
  // 1. Open your logo.svg file
  // 2. Copy everything between (and including) the <svg> tags
  // 3. Paste it here, replacing the current SVG content
  // 4. Make sure to:
  //    - Keep the className={className}
  //    - Keep the aria-label and role attributes
  //    - Update the viewBox if different from your SVG
  //    - Replace any hardcoded colors with {color}
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Science Based Baby Logo"
      role="img"
    >
      {/* Paste your SVG content here */}
      {/* Replace any hardcoded colors with {color} */}
      <path
        d="M16 3.2c-7.069 0-12.8 5.731-12.8 12.8 0 7.069 5.731 12.8 12.8 12.8 7.069 0 12.8-5.731 12.8-12.8 0-7.069-5.731-12.8-12.8-12.8zM16 26c-5.514 0-10-4.486-10-10S10.486 6 16 6s10 4.486 10 10-4.486 10-10 10z"
        fill={color}
      />
      <path
        d="M16 10c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 9.6c-1.982 0-3.6-1.618-3.6-3.6S14.018 12.4 16 12.4s3.6 1.618 3.6 3.6-1.618 3.6-3.6 3.6z"
        fill={color}
      />
      <path
        d="M16 14.4c-.884 0-1.6.716-1.6 1.6s.716 1.6 1.6 1.6 1.6-.716 1.6-1.6-.716-1.6-1.6-1.6z"
        fill={color}
      />
    </svg>
  );
}