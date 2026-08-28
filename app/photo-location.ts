import type { Coordinates } from './maplibre-map';

export type PhotoLocationResult =
  | { kind: 'found'; coordinates: Coordinates }
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
