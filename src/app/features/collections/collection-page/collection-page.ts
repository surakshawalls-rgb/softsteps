import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Collection } from '../../../shared/models/collection.model';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-collection-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './collection-page.html',
  styleUrl: './collection-page.css',
})
export class CollectionPage {
  loading = false;
  errorMessage = '';

  collections: Collection[] = [
    {
      id: 'col-1',
      name: 'Heritage Collection',
      slug: 'heritage',
      description: 'Traditional inspiration interpreted for contemporary homes.',
      image_url: 'https://images.unsplash.com/photo-1583845112203-454c7f2c2f4b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'col-2',
      name: 'Modern Living',
      slug: 'modern-living',
      description: 'Clean textures and modern patterns for everyday living.',
      image_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'col-3',
      name: 'Luxury Edit',
      slug: 'luxury-edit',
      description: 'Statement pieces selected for elegant interiors.',
      image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'col-4',
      name: 'Natural Living',
      slug: 'natural-living',
      description: 'Earthy colours, natural textures and relaxed character.',
      image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  products: Product[] = [
    {
      id: 'collection-product-1',
      name: 'Ivory Sand Handloom Rug',
      slug: 'ivory-sand-handloom-rug',
      category: { name: 'Handmade Rugs', slug: 'handmade-rugs' },
      material: { name: 'Wool', slug: 'wool' },
      status: 'active',
      variants: [{ price: 8499, sale_price: 7499, size: '5 x 8 ft', color: 'Ivory' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'collection-product-2',
      name: 'Royal Heritage Pattern',
      slug: 'royal-heritage-pattern',
      category: { name: 'Traditional Carpets', slug: 'traditional-carpets' },
      material: { name: 'Wool Blend', slug: 'wool-blend' },
      status: 'active',
      variants: [{ price: 12999, sale_price: 10999, size: '6 x 9 ft', color: 'Rust' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'collection-product-3',
      name: 'Natural Jute Texture',
      slug: 'natural-jute-texture',
      category: { name: 'Outdoor Rugs', slug: 'outdoor-rugs' },
      material: { name: 'Jute', slug: 'jute' },
      status: 'active',
      variants: [{ price: 4599, size: '4 x 6 ft', color: 'Natural' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    }
  ];

  selectedCollection: Collection | null = null;

  selectCollection(collection: Collection): void {
    this.selectedCollection = collection;
  }
  
  retry(): void {
    window.location.reload();
  }
}

