'use client';

interface LogoProps {
  readonly size?: number;
  readonly className?: string;
}

export function Logo({ size = 40, className = 'rounded-xl' }: LogoProps) {
  return (
    <img
      src="/icon.svg"
      width={size}
      height={size}
      alt="Izin Catat"
      className={className}
    />
  );
}
