import { Component } from '@angular/core';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { CatalogToolbar } from '../../../shared/components/catalog-toolbar/catalog-toolbar';
import { Product } from '../../../shared/models/product.model';
import {
  CatalogFilterState,
  DEFAULT_CATALOG_FILTER
} from '../../../shared/models/catalog-filter.model';
import { CatalogFilterService } from '../../../shared/services/catalog-filter.service';

@Component({
  selector: 'app-shop-page',
  imports: [ProductCard, CatalogToolbar],
  templateUrl: './shop-page.html',
  styleUrl: './shop-page.css',
})
export class ShopPage {

  loading = false;
  errorMessage = '';

  filter: CatalogFilterState = {
    ...DEFAULT_CATALOG_FILTER
  };

  products: Product[] = [
    {
      id: 'shop-1',
      name: 'Ivory Sand Handloom Rug',
      slug: 'ivory-sand-handloom-rug',
      short_description: 'Soft neutral tones with a handcrafted character.',
      category: { name: 'Handmade Rugs', slug: 'handmade-rugs' },
      material: { name: 'Wool', slug: 'wool' },
      status: 'active',
      featured: true,
      variants: [{ price: 8499, sale_price: 7499, size: '5 x 8 ft', color: 'Ivory' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-2',
      name: 'Terracotta Loom Carpet',
      slug: 'terracotta-loom-carpet',
      short_description: 'Warm earthy tones with a refined woven texture.',
      category: { name: 'Traditional Carpets', slug: 'traditional-carpets' },
      material: { name: 'Cotton', slug: 'cotton' },
      status: 'active',
      variants: [{ price: 6999, size: '5 x 7 ft', color: 'Terracotta' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1575410229391-19b4da01cc94?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-3',
      name: 'Moss & Stone Modern Rug',
      slug: 'moss-stone-modern-rug',
      short_description: 'Subtle modern pattern in calm natural tones.',
      category: { name: 'Modern Rugs', slug: 'modern-rugs' },
      material: { name: 'Polyester', slug: 'polyester' },
      status: 'active',
      featured: true,
      variants: [{ price: 5999, sale_price: 5299, size: '5 x 7 ft', color: 'Moss' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-4',
      name: 'Royal Heritage Pattern',
      slug: 'royal-heritage-pattern',
      short_description: 'Classic pattern with a rich traditional feel.',
      category: { name: 'Traditional Carpets', slug: 'traditional-carpets' },
      material: { name: 'Wool Blend', slug: 'wool-blend' },
      status: 'active',
      featured: true,
      variants: [{ price: 12999, sale_price: 10999, size: '6 x 9 ft', color: 'Rust' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-5',
      name: 'Natural Jute Texture',
      slug: 'natural-jute-texture',
      short_description: 'Organic texture for warm and relaxed interiors.',
      category: { name: 'Outdoor Rugs', slug: 'outdoor-rugs' },
      material: { name: 'Jute', slug: 'jute' },
      status: 'active',
      variants: [{ price: 4599, size: '4 x 6 ft', color: 'Natural' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-6',
      name: 'Midnight Geometric Rug',
      slug: 'midnight-geometric-rug',
      short_description: 'Bold geometric design with a contemporary finish.',
      category: { name: 'Modern Rugs', slug: 'modern-rugs' },
      material: { name: 'Viscose Blend', slug: 'viscose-blend' },
      status: 'active',
      variants: [{ price: 9499, sale_price: 8499, size: '6 x 9 ft', color: 'Charcoal' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-7',
      name: 'Desert Weave Runner',
      slug: 'desert-weave-runner',
      short_description: 'A warm woven runner for hallways and long spaces.',
      category: { name: 'Modern Rugs', slug: 'modern-rugs' },
      material: { name: 'Cotton', slug: 'cotton' },
      status: 'active',
      variants: [{ price: 3299, size: '2.5 x 8 ft', color: 'Sand' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'shop-8',
      name: 'Classic Blue Medallion',
      slug: 'classic-blue-medallion',
      short_description: 'A timeless medallion pattern with deep blue accents.',
      category: { name: 'Traditional Carpets', slug: 'traditional-carpets' },
      material: { name: 'Wool Blend', slug: 'wool-blend' },
      status: 'active',
      variants: [{ price: 11499, size: '6 x 9 ft', color: 'Blue' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    }
  ];

  constructor(
    public readonly catalogFilter: CatalogFilterService
  ) {}

  get filteredProducts(): Product[] {
    return this.catalogFilter.filterAndSort(
      this.products,
      this.filter
    );
  }

  get categories() {
    return this.catalogFilter.getCategories(this.products);
  }

  get materials() {
    return this.catalogFilter.getMaterials(this.products);
  }

  onFilterChange(filter: CatalogFilterState): void {
    this.filter = { ...filter };
  }

  clearFilters(): void {
    this.filter = this.catalogFilter.reset();
  }

  retry(): void {
    window.location.reload();
  }
}
