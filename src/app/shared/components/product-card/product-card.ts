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
    if (!this.product?.images?.length) {
      return null;
    }

    const primary =
      this.product.images.find(image => image.is_primary) ??
      this.product.images[0];

    return primary?.image_url ?? null;
  }

  get primaryVariant() {
    return this.product?.variants?.[0];
  }

  get price(): number | null {
    return this.primaryVariant?.price ?? null;
  }

  get salePrice(): number | null {
    return this.primaryVariant?.sale_price ?? null;
  }

}
