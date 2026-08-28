'use client';

import Link from 'next/link';
import { Bookmark, Compass, Map as MapIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type AppSurface = 'explore' | 'map' | 'saved';

type AppNavigationProps = {
  active?: AppSurface;
  onNavigate?: (surface: AppSurface) => void;
};

export default function AppNavigation({ active, onNavigate }: AppNavigationProps) {
  const destination = (surface: AppSurface) => surface === 'explore' ? '/' : `/?surface=${surface}`;
  const item = (surface: AppSurface, label: string, icon: ReactNode) => {
    const className = `app-tab ${active === surface ? 'active' : ''}`;
    return onNavigate ? (
      <button key={surface} className={className} type="button" onClick={() => onNavigate(surface)} aria-label={label}>
        {icon}<span>{label}</span>
      </button>
    ) : (
      <Link key={surface} className={className} href={destination(surface)} aria-label={label} aria-current={active === surface ? 'page' : undefined}>
        {icon}<span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="app-tabs" aria-label="Browse views">
      {item('explore', 'Explore', <Compass />)}
      {item('map', 'Map', <MapIcon />)}
      {item('saved', 'Saved', <Bookmark />)}
    </nav>
  );
}
