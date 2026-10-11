import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductImage } from '../product-image/product-image';
import { PriceDisplay } from '../price-display/price-display';

@Component({
  selector: 'app-product-card',
  imports: [
    RouterLink,
    ProductImage,
    PriceDisplay
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {

  @Input() product: Product | null = null;

  get primaryImage(): string | null {
    const images = (this.product?.images ?? []).filter(
      image => typeof image.image_url === 'string' && image.image_url.trim().length > 0,
    );
    const primary = images.find(image => image.is_primary === true) ?? images[0];
    return primary?.image_url?.trim() ?? null;
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
    return this.product?.base_price ?? null;
  }

  get salePrice(): number | null {
    if (this.primaryVariant?.sale_price !== undefined && this.primaryVariant?.sale_price !== null) {
      return this.primaryVariant.sale_price;
    }
    return this.product?.compare_at_price != null ? this.product.base_price ?? null : null;
  }

}
