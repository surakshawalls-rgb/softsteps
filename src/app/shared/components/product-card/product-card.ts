import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductImageUrlService } from '../../../data-access/supabase/product-image-url.service';
import { ProductImage } from '../product-image/product-image';
import { PriceDisplay } from '../price-display/price-display';
import { OfferBadge } from '../offer-badge/offer-badge';
@Component({
  selector: 'app-product-card',
    imports: [
    RouterLink,
    ProductImage,
    PriceDisplay,
    OfferBadge
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  private readonly imageUrls = inject(ProductImageUrlService);

  @Input() product: Product | null = null;

  get primaryImage(): string | null {
    const images = (this.product?.images ?? []).filter(
      image => typeof image.image_url === 'string' && image.image_url.trim().length > 0,
    );
    const primary = images.find(image => image.is_primary === true) ?? images[0];
    return primary?.image_url?.trim() ?? null;
  }

  get hoverImage(): string | null {
    const images = (this.product?.images ?? []).filter(
      image => typeof image.image_url === 'string' && image.image_url.trim().length > 0
    );
    const typedHover = images.find(image =>
      ['hover', 'hover_image', 'secondary'].includes(
        (image.image_type ?? '').toLowerCase().trim()
      )
    );
    if (typedHover) return this.imageUrls.publicUrl(typedHover.image_url);

    const primary = images.find(image => image.is_primary === true);
    const second = images.find(image => image !== primary);
    return this.imageUrls.publicUrl(second?.image_url);
  }

  get primaryVariant() {
    return this.product?.variants?.[0];
  }

  get price(): number | null {
    if (this.primaryVariant?.price !== undefined && this.primaryVariant?.price !== null) {
      return this.primaryVariant.price;
    }
    if (this.product?.base_price !== null && this.product?.base_price !== undefined && this.product?.compare_at_price != null) {
      return this.product.compare_at_price;
    }
    return this.product?.base_price ?? this.sizePrice;
  }

  get sizePrice(): number | null {
    const value = this.product?.specifications?.size_3x5_price;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
    return null;
  }

  get priceBasisLabel(): string | null {
    const size = this.product?.specifications?.size?.trim();
    return size || (this.sizePrice !== null ? '3 x 5 ft' : null);
  }

  get salePrice(): number | null {
    if (this.primaryVariant?.sale_price !== undefined && this.primaryVariant?.sale_price !== null) {
      return this.primaryVariant.sale_price;
    }
    return this.product?.compare_at_price != null ? this.product.base_price ?? null : null;
  }

}
