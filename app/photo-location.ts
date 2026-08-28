import type { Coordinates } from './maplibre-map';

export type PhotoLocationResult =
  | { kind: 'found'; coordinates: Coordinates }
  | { kind: 'missing' }
  | { kind: 'unreadable' };

export type PhotoCaptureTimeResult =
  | { kind: 'found'; localDateTime: string; timezoneOffset: string | null; source: 'exif' | 'file' }
  | { kind: 'missing' }
  | { kind: 'unreadable' };

export type PreparedPhoto = {
  blob: Blob;
  contentType: 'image/webp';
  extension: 'webp';
};

function isValidCoordinate(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false;
  const { latitude, longitude } = value as Partial<Coordinates>;
  return typeof latitude === 'number'
    && typeof longitude === 'number'
    && Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

/** Reads embedded GPS tags in the browser. Nothing is uploaded by this function. */
export async function readPhotoLocation(file: File): Promise<PhotoLocationResult> {
  try {
    const { gps } = await import('exifr');
    const coordinates = await gps(file);
    return isValidCoordinate(coordinates)
      ? { kind: 'found', coordinates }
      : { kind: 'missing' };
  } catch {
    return { kind: 'unreadable' };
  }
}

function parseExifDateTime(value: unknown, offsetValue: unknown): PhotoCaptureTimeResult {
  if (typeof value !== 'string') return { kind: 'missing' };
  const match = value.trim().match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return { kind: 'missing' };
  const [, year, month, day, hour, minute, second] = match;
  const parts = [year, month, day, hour, minute, second].map(Number);
  const check = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
  if (check.getUTCFullYear() !== parts[0]
    || check.getUTCMonth() !== parts[1] - 1
    || check.getUTCDate() !== parts[2]
    || check.getUTCHours() !== parts[3]
    || check.getUTCMinutes() !== parts[4]
    || check.getUTCSeconds() !== parts[5]) return { kind: 'missing' };

  const timezoneOffset = typeof offsetValue === 'string' && /^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offsetValue.trim())
    ? offsetValue.trim()
    : null;
  return { kind: 'found', localDateTime: `${year}-${month}-${day}T${hour}:${minute}:${second}`, timezoneOffset, source: 'exif' };
}

function fileDateFallback(file: File): PhotoCaptureTimeResult {
  const date = new Date(file.lastModified);
  if (!file.lastModified || Number.isNaN(date.getTime()) || date.getFullYear() < 1990 || date.getTime() > Date.now() + 86400000) {
    return { kind: 'missing' };
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  return {
    kind: 'found',
    localDateTime: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    timezoneOffset: `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
    source: 'file',
  };
}

/** Reads the camera's original local capture time without guessing a timezone. */
export async function readPhotoCaptureTime(file: File): Promise<PhotoCaptureTimeResult> {
  try {
    const { parse } = await import('exifr');
    const metadata = await parse(file, {
      exif: {
        pick: ['DateTimeOriginal', 'OffsetTimeOriginal', 'CreateDate'],
        reviveValues: false,
      },
    }) as Record<string, unknown> | undefined;
    if (!metadata) return fileDateFallback(file);
    const embeddedTime = parseExifDateTime(
      metadata.DateTimeOriginal ?? metadata.CreateDate,
      metadata.OffsetTimeOriginal,
    );
    return embeddedTime.kind === 'found' ? embeddedTime : fileDateFallback(file);
  } catch {
    return fileDateFallback(file);
  }
}

/**
 * Re-encodes the visible pixels before public upload. Canvas output contains no
 * EXIF/XMP blocks, so private capture time, device details, and GPS tags do not
 * travel with the public image.
 */
export async function preparePhotoForUpload(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const maxEdge = 4096;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo processing is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('The photo could not be prepared.')),
        'image/webp',
        0.92,
      );
    });
    if (blob.type !== 'image/webp') throw new Error('This browser cannot create a safe upload.');
    return { blob, contentType: 'image/webp', extension: 'webp' };
  } finally {
    bitmap.close();
  }
}
