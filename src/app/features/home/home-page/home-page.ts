import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Category } from '../../../shared/models/category.model';
import { Collection } from '../../../shared/models/collection.model';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './home-page.html',
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private revealObserver?: IntersectionObserver;

  loading = false;
  errorMessage = '';

  categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Modern Rugs',
      slug: 'modern-rugs',
      description: 'Contemporary rugs designed for modern interiors.',
      image_url: '/Category%20imgs/Modern_rugs.png'
    },
    {
      id: 'cat-2',
      name: 'Traditional Carpets',
      slug: 'traditional-carpets',
      description: 'Classic patterns with timeless character.',
      image_url: '/Category%20imgs/Traditional_carpets.jpg'
    },
    {
      id: 'cat-3',
      name: 'Handmade Rugs',
      slug: 'handmade-rugs',
      description: 'Crafted with care and distinctive detailing.',
      image_url: '/Home%20shop%20by%20style/Handknotted_rugs.png'
    },
    {
      id: 'cat-4',
      name: 'Luxury Carpets',
      slug: 'luxury-carpets',
      description: 'Premium carpets for refined spaces.',
      image_url: '/Category%20imgs/Luxury_rugs.jpg'
    },
    {
      id: 'cat-5',
      name: 'Outdoor Rugs',
      slug: 'outdoor-rugs',
      description: 'Durable styles made for versatile spaces.',
      image_url: '/Category%20imgs/Outdoor_rugs.png'
    },
    {
      id: 'cat-6',
      name: 'Custom Rugs',
      slug: 'custom-rugs',
      description: 'Create a rug around your space and style.',
      image_url: '/Category%20imgs/Irregular_rugs.jpg'
    }
  ];

  collections: Collection[] = [
    {
      id: 'col-1',
      name: 'Heritage Collection',
      slug: 'heritage',
      description: 'Traditional inspiration interpreted for contemporary homes.',
      image_url: '/Home%20banner%20img%209-16/3rd_img%283_4%29.png'
    },
    {
      id: 'col-2',
      name: 'Modern Living',
      slug: 'modern-living',
      description: 'Clean textures and modern patterns for everyday living.',
      image_url: '/Home%20banner%20img%209-16/2nd_img%283_4%29.png'
    },
    {
      id: 'col-3',
      name: 'Luxury Edit',
      slug: 'luxury-edit',
      description: 'Statement pieces selected for elegant interiors.',
      image_url: '/Home%20banner%20img%209-16/4th_img%283_4%29.png'
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
          image_url: '/Trending%20rugs/ss_trending1_1.jpg',
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
          image_url: '/Trending%20rugs/ss_trending2_1.jpg',
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
          image_url: '/Trending%20rugs/ss_trending3_1.jpg',
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
          image_url: '/Trending%20rugs/ss_trending4_1.jpg',
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
          image_url: '/Trending%20rugs/ss_trending5_1.jpg',
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
          image_url: '/Trending%20rugs/ss_trending6_1.jpg',
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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    void import('gsap').then(({ gsap }) => {
      const sections = this.host.nativeElement.querySelectorAll('[data-reveal]');
      this.revealObserver = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              gsap.fromTo(
                entry.target,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
              );
              this.revealObserver?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15 },
      );

      sections.forEach(section => this.revealObserver?.observe(section));
    });
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
  }

  scrollCarousel(track: HTMLElement, direction: number): void {
    track.scrollBy({
      left: direction * Math.max(track.clientWidth * 0.8, 280),
      behavior: 'smooth',
    });
  }
  
  retry(): void {
    window.location.reload();
  }
}
