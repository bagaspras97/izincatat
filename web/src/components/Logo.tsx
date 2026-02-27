'use client';

import { useTheme } from './ThemeProvider';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = 'rounded-xl' }: LogoProps) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? '/logo.svg' : '/logo-light.svg';

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Izin Catat"
      className={className}
    />
  );
}
