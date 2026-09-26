import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-price-display',
  imports: [DecimalPipe],
  templateUrl: './price-display.html',
  styleUrl: './price-display.css',
})
export class PriceDisplay {

  @Input() price: number | null | undefined = null;
  @Input() salePrice: number | null | undefined = null;
  @Input() currency = '₹';

  get hasSale(): boolean {
    return (
      this.salePrice !== null &&
      this.salePrice !== undefined &&
      this.price !== null &&
      this.price !== undefined &&
      this.salePrice < this.price
    );
  }

}
