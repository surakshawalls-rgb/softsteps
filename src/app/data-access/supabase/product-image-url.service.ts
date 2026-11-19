import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class ProductImageUrlService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly bucket = 'product-images';
  private readonly publicObjectPath = `/storage/v1/object/public/${this.bucket}/`;

  publicUrl(value: string | null | undefined): string | null {
    const source = value?.trim();
    if (!source) return null;

    let imagePath = this.extractBucketPath(source);
    if (imagePath === null) {
      if (/^https?:\/\//i.test(source)) {
        // Keep unrelated external image URLs intact; don't return malformed Supabase URLs.
        try {
          const host = new URL(source).hostname;
          if (host.endsWith('.supabase.co')) return null;
        } catch {
          return null;
        }
        return source;
      }
      if (source.startsWith('/')) {
        const rootPath = source.replace(/^\/+/, '').split(/[?#]/, 1)[0];
        if (!/^(?:modern-rugs|Modern_rugs)\//i.test(rootPath)) return source;
        imagePath = rootPath;
      } else {
        imagePath = source.split(/[?#]/, 1)[0];
      }
    }

    if (!imagePath) return null;
    if (/^Modern_rugs\//i.test(imagePath)) {
      imagePath = imagePath.replace(/^Modern_rugs\//i, 'modern-rugs/');
    }

    return this.supabase.storage.from(this.bucket).getPublicUrl(imagePath).data.publicUrl;
  }

  private extractBucketPath(source: string): string | null {
    let path = source;
    if (/^https?:\/\//i.test(source)) {
      try {
        path = new URL(source).pathname;
      } catch {
        return null;
      }
    }

    const lowerPath = path.toLowerCase();
    const publicPath = this.publicObjectPath.toLowerCase();
    const publicPathIndex = lowerPath.lastIndexOf(publicPath);
    if (publicPathIndex >= 0) {
      return this.decodePath(path.slice(publicPathIndex + this.publicObjectPath.length));
    }

    const bucketPrefix = `/${this.bucket}/`;
    const bucketIndex = lowerPath.lastIndexOf(bucketPrefix);
    if (bucketIndex >= 0) {
      return this.decodePath(path.slice(bucketIndex + bucketPrefix.length));
    }

    const relativeBucketPrefix = `${this.bucket}/`;
    if (lowerPath.startsWith(relativeBucketPrefix)) {
      return this.decodePath(path.slice(relativeBucketPrefix.length));
    }

    return null;
  }

  private decodePath(path: string): string {
    try {
      return decodeURIComponent(path).replace(/^\/+/, '').split(/[?#]/, 1)[0];
    } catch {
      return path.replace(/^\/+/, '').split(/[?#]/, 1)[0];
    }
  }
}
