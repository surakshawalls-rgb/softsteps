import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ProductImage } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-gallery',
  imports: [],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.css',
})
export class ProductGallery implements OnChanges {
  @Input() images: ProductImage[] = [];
  @Input() productName = 'Carpet or rug';

  selectedImage: ProductImage | null = null;
  failedImageUrls = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.selectedImage = null;
      this.failedImageUrls = new Set<string>();
    }
  }

  get orderedImages(): ProductImage[] {
    return [...(this.images ?? [])].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }

  get activeImage(): ProductImage | null {
    const images = this.orderedImages;
    if (!images.length) return null;
    if (this.selectedImage && images.some(image => image.image_url === this.selectedImage?.image_url)) {
      return this.selectedImage;
    }
    return images[0];
  }

  selectImage(image: ProductImage): void {
    this.selectedImage = image;
  }

  handleImageError(imageUrl: string | undefined): void {
    if (imageUrl) {
      this.failedImageUrls.add(imageUrl);
    }
  }
}
