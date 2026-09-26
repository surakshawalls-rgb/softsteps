import { Routes } from '@angular/router';

import { HomePage } from './features/home/home-page/home-page';
import { ShopPage } from './features/shop/shop-page/shop-page';
import { CategoryPage } from './features/categories/category-page/category-page';
import { CollectionPage } from './features/collections/collection-page/collection-page';
import { ProductPage } from './features/products/product-page/product-page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    title: 'Soft Steps Carpets & Rugs'
  },
  {
    path: 'shop',
    component: ShopPage,
    title: 'Shop | Soft Steps Carpets & Rugs'
  },
  {
    path: 'categories',
    component: CategoryPage,
    title: 'Categories | Soft Steps Carpets & Rugs'
  },
  {
    path: 'categories/:slug',
    component: CategoryPage,
    title: 'Category | Soft Steps Carpets & Rugs'
  },
  {
    path: 'collections',
    component: CollectionPage,
    title: 'Collections | Soft Steps Carpets & Rugs'
  },
  {
    path: 'collections/:slug',
    component: CollectionPage,
    title: 'Collection | Soft Steps Carpets & Rugs'
  },
  {
    path: 'products/:slug',
    component: ProductPage,
    title: 'Product | Soft Steps Carpets & Rugs'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
