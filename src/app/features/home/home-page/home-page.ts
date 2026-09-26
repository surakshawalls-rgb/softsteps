import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Category } from '../../../shared/models/category.model';
import { Collection } from '../../../shared/models/collection.model';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  loading = false;
  errorMessage = '';

  categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Modern Rugs',
      slug: 'modern-rugs',
      description: 'Contemporary rugs designed for modern interiors.',
      image_url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'cat-2',
      name: 'Traditional Carpets',
      slug: 'traditional-carpets',
      description: 'Classic patterns with timeless character.',
      image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'cat-3',
      name: 'Handmade Rugs',
      slug: 'handmade-rugs',
      description: 'Crafted with care and distinctive detailing.',
      image_url: 'https://images.unsplash.com/photo-1575410229391-19b4da01cc94?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'cat-4',
      name: 'Luxury Carpets',
      slug: 'luxury-carpets',
      description: 'Premium carpets for refined spaces.',
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'cat-5',
      name: 'Outdoor Rugs',
      slug: 'outdoor-rugs',
      description: 'Durable styles made for versatile spaces.',
      image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 'cat-6',
      name: 'Custom Rugs',
      slug: 'custom-rugs',
      description: 'Create a rug around your space and style.',
      image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80'
    }
  ];

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
    }
  ];

  featuredProducts: Product[] = [
    {
      id: 'p-1',
      name: 'Ivory Sand Handloom Rug',
      slug: 'ivory-sand-handloom-rug',
      short_description: 'Soft neutral tones with a handcrafted character.',
      category: this.categories[2],
      material: { id: 'm-1', name: 'Wool', slug: 'wool' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-1',
          price: 8499,
          sale_price: 7499,
          size: '5 x 8 ft',
          color: 'Ivory',
          stock_quantity: 10,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-1',
          image_url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Ivory Sand Handloom Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-2',
      name: 'Terracotta Loom Carpet',
      slug: 'terracotta-loom-carpet',
      short_description: 'Warm earthy tones with a refined woven texture.',
      category: this.categories[1],
      material: { id: 'm-2', name: 'Cotton', slug: 'cotton' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-2',
          price: 6999,
          size: '5 x 7 ft',
          color: 'Terracotta',
          stock_quantity: 8,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-2',
          image_url: 'https://images.unsplash.com/photo-1575410229391-19b4da01cc94?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Terracotta Loom Carpet',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-3',
      name: 'Moss & Stone Modern Rug',
      slug: 'moss-stone-modern-rug',
      short_description: 'Subtle modern pattern in calm natural tones.',
      category: this.categories[0],
      material: { id: 'm-3', name: 'Polyester', slug: 'polyester' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-3',
          price: 5999,
          sale_price: 5299,
          size: '5 x 7 ft',
          color: 'Moss',
          stock_quantity: 12,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-3',
          image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Moss and Stone Modern Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-4',
      name: 'Royal Heritage Pattern',
      slug: 'royal-heritage-pattern',
      short_description: 'Classic pattern with a rich traditional feel.',
      category: this.categories[1],
      material: { id: 'm-4', name: 'Wool Blend', slug: 'wool-blend' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-4',
          price: 12999,
          sale_price: 10999,
          size: '6 x 9 ft',
          color: 'Rust',
          stock_quantity: 5,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-4',
          image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Royal Heritage Pattern Carpet',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-5',
      name: 'Natural Jute Texture',
      slug: 'natural-jute-texture',
      short_description: 'Organic texture for warm and relaxed interiors.',
      category: this.categories[4],
      material: { id: 'm-5', name: 'Jute', slug: 'jute' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-5',
          price: 4599,
          size: '4 x 6 ft',
          color: 'Natural',
          stock_quantity: 15,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-5',
          image_url: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Natural Jute Texture Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    },
    {
      id: 'p-6',
      name: 'Midnight Geometric Rug',
      slug: 'midnight-geometric-rug',
      short_description: 'Bold geometric design with a contemporary finish.',
      category: this.categories[0],
      material: { id: 'm-6', name: 'Viscose Blend', slug: 'viscose-blend' },
      status: 'active',
      featured: true,
      variants: [
        {
          id: 'v-6',
          price: 9499,
          sale_price: 8499,
          size: '6 x 9 ft',
          color: 'Charcoal',
          stock_quantity: 7,
          is_active: true
        }
      ],
      images: [
        {
          id: 'i-6',
          image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80',
          alt_text: 'Midnight Geometric Rug',
          is_primary: true,
          sort_order: 1
        }
      ]
    }
  ];

  get categoryPreview(): Category[] {
    return this.categories.slice(0, 6);
  }

  get collectionPreview(): Collection[] {
    return this.collections.slice(0, 3);
  }

  get productPreview(): Product[] {
    return this.featuredProducts.slice(0, 6);
  }
  
  retry(): void {
    window.location.reload();
  }
}

