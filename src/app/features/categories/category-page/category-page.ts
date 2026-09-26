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
      image_url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cat-2',
      name: 'Traditional Carpets',
      slug: 'traditional-carpets',
      description: 'Classic patterns and rich details inspired by timeless carpet traditions.',
      image_url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cat-3',
      name: 'Handmade Rugs',
      slug: 'handmade-rugs',
      description: 'Handcrafted textures and distinctive character for spaces that feel personal.',
      image_url: 'https://images.unsplash.com/photo-1575410229391-19b4da01cc94?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cat-4',
      name: 'Luxury Carpets',
      slug: 'luxury-carpets',
      description: 'Premium-looking designs selected for elegant living and hospitality spaces.',
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cat-5',
      name: 'Outdoor Rugs',
      slug: 'outdoor-rugs',
      description: 'Practical and stylish options for balconies, patios and versatile spaces.',
      image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80'
    },
    {
      id: 'cat-6',
      name: 'Custom Rugs',
      slug: 'custom-rugs',
      description: 'Discuss custom sizes, colours and designs for your specific requirement.',
      image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80'
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
      images: [{ image_url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
    },
    {
      id: 'cat-product-2',
      name: 'Midnight Geometric Rug',
      slug: 'midnight-geometric-rug',
      category: this.categories[0],
      material: { name: 'Viscose Blend', slug: 'viscose-blend' },
      status: 'active',
      variants: [{ price: 9499, sale_price: 8499, size: '6 x 9 ft', color: 'Charcoal' }],
      images: [{ image_url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80', is_primary: true }]
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

