import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Category } from '../../../shared/models/category.model';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-category-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './category-page.html',
  styleUrl: './category-page.css',
})
export class CategoryPage {
  loading = false;
  errorMessage = '';

  categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Modern Rugs',
      slug: 'modern-rugs',
      description: 'Clean lines, contemporary patterns and versatile textures for modern interiors.',
      image_url: '/Category%20imgs/Modern_rugs.png'
    },
    {
      id: 'cat-2',
      name: 'Traditional Carpets',
      slug: 'traditional-carpets',
      description: 'Classic patterns and rich details inspired by timeless carpet traditions.',
      image_url: '/Category%20imgs/Traditional_carpets.jpg'
    },
    {
      id: 'cat-3',
      name: 'Handmade Rugs',
      slug: 'handmade-rugs',
      description: 'Handcrafted textures and distinctive character for spaces that feel personal.',
      image_url: '/Home%20shop%20by%20style/Handknotted_rugs.png'
    },
    {
      id: 'cat-4',
      name: 'Luxury Carpets',
      slug: 'luxury-carpets',
      description: 'Premium-looking designs selected for elegant living and hospitality spaces.',
      image_url: '/Category%20imgs/Luxury_rugs.jpg'
    },
    {
      id: 'cat-5',
      name: 'Outdoor Rugs',
      slug: 'outdoor-rugs',
      description: 'Practical and stylish options for balconies, patios and versatile spaces.',
      image_url: '/Category%20imgs/Outdoor_rugs.png'
    },
    {
      id: 'cat-6',
      name: 'Custom Rugs',
      slug: 'custom-rugs',
      description: 'Discuss custom sizes, colours and designs for your specific requirement.',
      image_url: '/Category%20imgs/Irregular_rugs.jpg'
    }
  ];

  products: Product[] = [
    {
      id: 'cat-product-1',
      name: 'Moss & Stone Modern Rug',
      slug: 'moss-stone-modern-rug',
      category: this.categories[0],
      material: { name: 'Polyester', slug: 'polyester' },
      status: 'active',
      variants: [{ price: 5999, sale_price: 5299, size: '5 x 7 ft', color: 'Moss' }],
      images: [{ image_url: '/Trending%20rugs/ss_trending3_1.jpg', is_primary: true }]
    },
    {
      id: 'cat-product-2',
      name: 'Midnight Geometric Rug',
      slug: 'midnight-geometric-rug',
      category: this.categories[0],
      material: { name: 'Viscose Blend', slug: 'viscose-blend' },
      status: 'active',
      variants: [{ price: 9499, sale_price: 8499, size: '6 x 9 ft', color: 'Charcoal' }],
      images: [{ image_url: '/Trending%20rugs/ss_trending6_1.jpg', is_primary: true }]
    }
  ];

  selectedCategory: Category | null = null;

  selectCategory(category: Category): void {
    this.selectedCategory = category;
  }
  
  retry(): void {
    window.location.reload();
  }
}
