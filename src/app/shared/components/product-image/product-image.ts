import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ProductImageUrlService } from '../../../data-access/supabase/product-image-url.service';

@Component({
  selector: 'app-product-image',
  imports: [],
  templateUrl: './product-image.html',
  styleUrl: './product-image.css',
})
export class ProductImage implements OnChanges {
  private readonly imageUrls = inject(ProductImageUrlService);

  @Input() src: string | null = null;
  @Input() alt = 'Carpet or rug';
  @Input() aspectRatio = 'aspect-square';
  @Input() fallbackSrc = '/Category%20imgs/Luxury_rugs.jpg';

  imageFailed = false;
  fallbackFailed = false;
  private resolvedSrc: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] || changes['fallbackSrc']) {
      this.imageFailed = false;
      this.fallbackFailed = false;
      this.resolvedSrc = this.imageUrls.publicUrl(this.src);
    }
  }

  get displaySrc(): string {
    if (this.resolvedSrc && !this.imageFailed) {
      return this.resolvedSrc;
    }
    return this.fallbackFailed ? '' : this.fallbackSrc;
  }

  handleImageError(): void {
    if (this.src && !this.imageFailed && this.src !== this.fallbackSrc) {
      this.imageFailed = true;
      return;
    }

    this.fallbackFailed = true;
  }

}
