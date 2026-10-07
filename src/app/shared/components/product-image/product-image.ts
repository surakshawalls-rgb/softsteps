import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-product-image',
  imports: [],
  templateUrl: './product-image.html',
  styleUrl: './product-image.css',
})
export class ProductImage implements OnChanges {

  @Input() src: string | null = null;
  @Input() alt = 'Carpet or rug';
  @Input() aspectRatio = 'aspect-square';
  @Input() fallbackSrc = '/Category%20imgs/Luxury_rugs.jpg';

  imageFailed = false;
  fallbackFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] || changes['fallbackSrc']) {
      this.imageFailed = false;
      this.fallbackFailed = false;
    }
  }

  get displaySrc(): string {
    return this.imageFailed || !this.src ? this.fallbackSrc : this.src;
  }

  handleImageError(): void {
    if (this.src && !this.imageFailed && this.src !== this.fallbackSrc) {
      this.imageFailed = true;
      return;
    }

    this.fallbackFailed = true;
  }

}
