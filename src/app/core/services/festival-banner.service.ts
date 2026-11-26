import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

/**
 * The size every home hero banner must have. It matches the photos that are already in the
 * home hero (1200 x 896 px). Change the two numbers here if the hero size ever changes.
 */
export const HERO_BANNER_SIZE = { width: 1200, height: 896 } as const;

export const HERO_BANNER_MAX_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'festival-banners';
const TABLE = 'festival_banners';
const COLUMNS = 'festival, image_url, storage_path, width, height';

export interface ImageSize {
  width: number;
  height: number;
}

export interface FestivalBanner {
  festival: string;
  image_url: string;
  storage_path: string;
  width: number;
  height: number;
}

/** Reads the real pixel size of an image file in the browser. */
export async function readImageSize(file: File): Promise<ImageSize> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    throw new Error('This file could not be read as an image. Choose a JPG, PNG or WebP image.');
  }
}

/** Empty text = the file is fine. Otherwise the message to show below the image. */
export function checkBannerFile(file: File, size: ImageSize): string {
  const { width, height } = HERO_BANNER_SIZE;

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Choose a JPG, PNG or WebP image.';
  }

  if (size.width !== width || size.height !== height) {
    return `Dimensions don't match. This image is ${size.width} × ${size.height} px, but the home hero banner must be ${width} × ${height} px.`;
  }

  if (file.size > HERO_BANNER_MAX_BYTES) {
    return `The image is larger than ${HERO_BANNER_MAX_BYTES / (1024 * 1024)} MB. Compress it and upload again.`;
  }

  return '';
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'festival';
}

/** Home hero banners uploaded by the admin, one per festival name (used again every year). */
@Injectable({ providedIn: 'root' })
export class FestivalBannerService {
  private readonly client = inject(SupabaseService).client;

  /** festival name -> public image URL. Never fails: on any problem the hero keeps its artwork. */
  async getUrls(): Promise<Record<string, string>> {
    try {
      const { data, error } = await this.client.from(TABLE).select('festival, image_url');

      if (error || !data) {
        return {};
      }

      const urls: Record<string, string> = {};

      for (const row of data as { festival: string; image_url: string }[]) {
        urls[row.festival] = row.image_url;
      }

      return urls;
    } catch {
      return {};
    }
  }

  /** Admin page: throws when the table does not exist yet, so the page can show the setup note. */
  async listAll(): Promise<FestivalBanner[]> {
    const { data, error } = await this.client.from(TABLE).select(COLUMNS);

    if (error) {
      throw error;
    }

    return (data ?? []) as FestivalBanner[];
  }

  /** Uploads the (already checked) file and makes it the banner of that festival. */
  async save(festival: string, file: File, size: ImageSize): Promise<FestivalBanner> {
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${slugify(festival)}/${crypto.randomUUID()}.${extension}`;
    const storage = this.client.storage.from(BUCKET);

    const upload = await storage.upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

    if (upload.error) {
      throw upload.error;
    }

    const previous = await this.storagePathOf(festival);

    const { data, error } = await this.client
      .from(TABLE)
      .upsert(
        {
          festival,
          image_url: storage.getPublicUrl(path).data.publicUrl,
          storage_path: path,
          width: size.width,
          height: size.height,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'festival' },
      )
      .select(COLUMNS)
      .single();

    if (error) {
      await storage.remove([path]);
      throw error;
    }

    if (previous && previous !== path) {
      await storage.remove([previous]);
    }

    return data as FestivalBanner;
  }

  async remove(festival: string): Promise<void> {
    const previous = await this.storagePathOf(festival);
    const { error } = await this.client.from(TABLE).delete().eq('festival', festival);

    if (error) {
      throw error;
    }

    if (previous) {
      await this.client.storage.from(BUCKET).remove([previous]);
    }
  }

  private async storagePathOf(festival: string): Promise<string | null> {
    const { data } = await this.client
      .from(TABLE)
      .select('storage_path')
      .eq('festival', festival)
      .maybeSingle();

    return (data as { storage_path?: string } | null)?.storage_path ?? null;
  }
}