import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Product } from '../../../shared/models/product.model';
import { CatalogQueryService } from '../../../data-access/queries/catalog/catalog-query.service';
import { ShopPage } from './shop-page';

describe('ShopPage', () => {
  it('renders products after the catalog request completes', async () => {
    const products: Product[] = [{
      id: 'rug-1',
      name: 'Modern test rug',
      slug: 'modern-test-rug',
      images: [],
    }];
    const query = {
      getProducts: async () => products,
    };

    await TestBed.configureTestingModule({
      imports: [ShopPage],
      providers: [
        provideRouter([]),
        { provide: CatalogQueryService, useValue: query },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShopPage);
    fixture.autoDetectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);

    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.products).toEqual(products);
    expect(fixture.nativeElement.textContent).toContain('Modern test rug');
  });
});
