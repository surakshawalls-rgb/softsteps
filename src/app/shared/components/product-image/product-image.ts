import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-product-image',
  imports: [],
  templateUrl: './product-image.html',
  styleUrl: './product-image.css',
})
export class ProductImage {

  @Input() src: string | null = null;
  @Input() alt = 'Carpet or rug';
  @Input() aspectRatio = 'aspect-square';

}
