import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductCard } from './product-card';

describe('ProductCard', () => {
  it('selects the primary image for this product and ignores unusable URLs', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductCard);
    const product: Product = {
      product_code: 'SS_1001',
      images: [
        { image_url: ' ', is_primary: true },
        {
          image_url: 'https://example.supabase.co/storage/Modern_rug1_2.jpg',
          is_primary: false,
        },
        {
          image_url: 'https://example.supabase.co/storage/Modern_rug1_1.jpg',
          is_primary: true,
        },
      ],
    };
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();

    expect(fixture.componentInstance.primaryImage)
      .toBe('https://example.supabase.co/storage/Modern_rug1_1.jpg');
    expect(fixture.nativeElement.querySelector('app-product-image img').getAttribute('src'))
      .toBe('https://example.supabase.co/storage/Modern_rug1_1.jpg');
  });

  it('uses the first usable image belonging to the product when none is marked primary', async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', {
      product_code: 'SS_1002',
      images: [
        { image_url: '' },
        { image_url: 'https://example.supabase.co/storage/Modern_rugs2_1.jpg' },
      ],
    } satisfies Product);
    fixture.detectChanges();

    expect(fixture.componentInstance.primaryImage)
      .toBe('https://example.supabase.co/storage/Modern_rugs2_1.jpg');
  });
});
