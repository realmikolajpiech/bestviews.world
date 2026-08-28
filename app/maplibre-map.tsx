'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import type { Viewpoint } from './view-data';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const MAPLIBRE_WORKER_URL = '/maplibre/maplibre-gl-worker.mjs';

export type Coordinates = { latitude: number; longitude: number };

type BaseMapProps = {
  className?: string;
  ariaLabel: string;
};

export function ExploreMap({
  viewpoints,
  selected,
  onSelect,
  ariaLabel,
}: BaseMapProps & {
  viewpoints: Viewpoint[];
  selected: Viewpoint;
  onSelect: (viewpoint: Viewpoint) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef(new Map<string, { marker: MapLibreMarker; button: HTMLButtonElement }>());
  const onSelectRef = useRef(onSelect);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    const markers = markerRefs.current;

    void import('maplibre-gl').then(({ LngLatBounds, Map, Marker, NavigationControl, GeolocateControl, setWorkerUrl }) => {
      if (disposed || !containerRef.current) return;
      setWorkerUrl(MAPLIBRE_WORKER_URL);

      const map = new Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [10, 39],
        zoom: 2.2,
        minZoom: 1.5,
      });
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right');

      const bounds = new LngLatBounds();
      viewpoints.forEach((viewpoint) => {
        bounds.extend([viewpoint.longitude, viewpoint.latitude]);

        const shell = document.createElement('div');
        shell.className = 'maplibre-photo-shell';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `photo-marker${viewpoint.slug === selected.slug ? ' active' : ''}`;
        button.style.backgroundImage = `url('${viewpoint.thumb}')`;
        button.setAttribute('aria-label', `Show ${viewpoint.title}`);
        button.addEventListener('click', () => onSelectRef.current(viewpoint));
        shell.append(button);

        const marker = new Marker({ element: shell, anchor: 'bottom' })
          .setLngLat([viewpoint.longitude, viewpoint.latitude])
          .addTo(map);
        markers.set(viewpoint.slug, { marker, button });
      });

      map.once('load', () => {
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 90, maxZoom: 4.3, duration: 0 });
      });
    });

    return () => {
      disposed = true;
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // The published viewpoints are static for the lifetime of this map.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markerRefs.current.forEach(({ button }, slug) => button.classList.toggle('active', slug === selected.slug));
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 7), essential: true });
  }, [selected]);

  return <div ref={containerRef} className="maplibre-canvas" role="application" aria-label={ariaLabel} />;
}

export function ViewpointMap({
  coordinate,
  ariaLabel,
  className = '',
}: BaseMapProps & { coordinate: Coordinates }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let map: MapLibreMap | null = null;

    void import('maplibre-gl').then(({ Map, Marker, NavigationControl, setWorkerUrl }) => {
      if (disposed || !containerRef.current) return;
      setWorkerUrl(MAPLIBRE_WORKER_URL);
      map = new Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [coordinate.longitude, coordinate.latitude],
        zoom: 13.5,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      const element = document.createElement('div');
      element.className = 'exact-map-marker';
      element.setAttribute('aria-label', 'Exact viewpoint');
      new Marker({ element, anchor: 'bottom' })
        .setLngLat([coordinate.longitude, coordinate.latitude])
        .addTo(map);
    });

    return () => { disposed = true; map?.remove(); };
  }, [coordinate.latitude, coordinate.longitude]);

  return <div ref={containerRef} className={`maplibre-canvas ${className}`} role="application" aria-label={ariaLabel} />;
}

export function LocationPickerMap({
  coordinate,
  onChange,
  ariaLabel,
  className = '',
}: BaseMapProps & {
  coordinate: Coordinates | null;
  onChange: (coordinate: Coordinates) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    void import('maplibre-gl').then(({ Map, Marker, NavigationControl, setWorkerUrl }) => {
      if (disposed || !containerRef.current) return;
      setWorkerUrl(MAPLIBRE_WORKER_URL);
      const initial = coordinate ?? { latitude: 44.5, longitude: 10.5 };
      const map = new Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [initial.longitude, initial.latitude],
        zoom: coordinate ? 13 : 3.3,
      });
      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

      const element = document.createElement('div');
      element.className = 'exact-map-marker picker';
      const marker = new Marker({ element, anchor: 'bottom', draggable: true })
        .setLngLat([initial.longitude, initial.latitude]);
      markerRef.current = marker;
      if (coordinate) marker.addTo(map);

      const setLocation = (longitude: number, latitude: number) => {
        if (!marker.getElement().parentElement) marker.addTo(map);
        marker.setLngLat([longitude, latitude]);
        onChangeRef.current({ latitude, longitude });
      };

      map.on('click', (event) => setLocation(event.lngLat.lng, event.lngLat.lat));
      marker.on('dragend', () => {
        const point = marker.getLngLat();
        onChangeRef.current({ latitude: point.lat, longitude: point.lng });
      });
    });

    return () => {
      disposed = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // Initial coordinate is intentionally captured once; later changes are handled below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !coordinate) return;
    if (!marker.getElement().parentElement) marker.addTo(map);
    marker.setLngLat([coordinate.longitude, coordinate.latitude]);
    map.flyTo({ center: [coordinate.longitude, coordinate.latitude], zoom: Math.max(map.getZoom(), 13), essential: true });
  }, [coordinate]);

  return <div ref={containerRef} className={`maplibre-canvas ${className}`} role="application" aria-label={ariaLabel} />;
}
