"use client";

import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

const icons = [
  // Cuisine
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M8 28h24M12 28V14c0-2 2-4 4-4h0c2 0 4 2 4 4v14M22 28V10h2c3 0 5 2 5 5v13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M24 14h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  ),
  // Climatisation
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M20 8v24M8 20h24M12.5 12.5l15 15M27.5 12.5l-15 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.5" stroke="currentColor" strokeWidth="1.7" />
    </Svg>
  ),
  // Wi-Fi
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M8 16c6.5-6 17.5-6 24 0M12.5 20.5c4.2-4 10.8-4 15 0M16.5 25c2-1.8 5-1.8 7 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="20" cy="29.5" r="1.8" fill="currentColor" />
    </Svg>
  ),
  // Salon & écran
  (props: IconProps) => (
    <Svg {...props}>
      <rect x="7" y="10" width="26" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14 32h12M20 26v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  ),
  // Pont & jardin
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M6 26c4-7 8-7 14 0s10 7 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M20 10v8M16 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 30h24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  ),
  // Linge
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M10 12h20v18H10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 12c3 4 7 4 10 0s7-4 10 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 22h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  ),
  // Parking
  (props: IconProps) => (
    <Svg {...props}>
      <path d="M8 26h24l-2-8H10l-2 8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 18l2-6h12l2 6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="13" cy="26" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="27" cy="26" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </Svg>
  ),
  // Enfants
  (props: IconProps) => (
    <Svg {...props}>
      <circle cx="20" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 30c1.5-6 5-9 8-9s6.5 3 8 9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 22h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  ),
] as const;

export function AmenityIcon({ index, className }: { index: number; className?: string }) {
  const Icon = icons[index % icons.length];
  return <Icon className={className} />;
}
