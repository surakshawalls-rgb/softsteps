import { TestBed } from '@angular/core/testing';
import { CatalogFilterState, DEFAULT_CATALOG_FILTER } from '../models/catalog-filter.model';
import { Product } from '../models/product.model';
import { CatalogFilterService } from './catalog-filter.service';

describe('CatalogFilterService', () => {
  let service: CatalogFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogFilterService);
  });

  it('keeps products without prices visible and reports no price', () => {
    const products: Product[] = [{ name: 'Price on enquiry', base_price: null }];

    expect(service.getPrice(products[0])).toBeNull();
    expect(service.filterAndSort(products, { ...DEFAULT_CATALOG_FILTER })).toEqual(products);
  });

  it('excludes unpriced products from an explicit price range', () => {
    const products: Product[] = [
      { name: 'Price on enquiry', base_price: null },
      { name: 'Priced rug', base_price: 250 },
    ];
    const filters: CatalogFilterState = {
      ...DEFAULT_CATALOG_FILTER,
      minPrice: 100,
      maxPrice: 300,
    };

    expect(service.filterAndSort(products, filters).map(product => product.name)).toEqual(['Priced rug']);
  });

  it('sorts unpriced products after priced products in either direction', () => {
    const products: Product[] = [
      { name: 'Unpriced', base_price: null },
      { name: 'Expensive', base_price: 500 },
      { name: 'Affordable', base_price: 100 },
    ];

    expect(service.filterAndSort(products, { ...DEFAULT_CATALOG_FILTER, sort: 'price-low' })
      .map(product => product.name)).toEqual(['Affordable', 'Expensive', 'Unpriced']);
    expect(service.filterAndSort(products, { ...DEFAULT_CATALOG_FILTER, sort: 'price-high' })
      .map(product => product.name)).toEqual(['Expensive', 'Affordable', 'Unpriced']);
  });
});
