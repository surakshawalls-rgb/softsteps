import { Routes } from '@angular/router';

import { HomePage } from './features/home/home-page/home-page';
import { ShopPage } from './features/shop/shop-page/shop-page';
import { CategoryPage } from './features/categories/category-page/category-page';
import { CollectionPage } from './features/collections/collection-page/collection-page';
import { ProductPage } from './features/products/product-page/product-page';

import { AboutPage } from './features/about/about-page/about-page';
import { ContactPage } from './features/contact/contact-page/contact-page';
import { EnquiryForm } from './features/enquiries/enquiry-form/enquiry-form';
import { CustomRequirementPage } from './features/custom-requirement/custom-requirement-page/custom-requirement-page';
import { PrivacyPolicyPage } from './features/privacy-policy/privacy-policy-page/privacy-policy-page';
import { TermsPage } from './features/terms/terms-page/terms-page';

export const routes: Routes = [

  {
    path: '',
    component: HomePage,
    title: 'Soft Steps Carpets | Handcrafted Luxury Carpets from India'
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
    path: 'about',
    component: AboutPage,
    title: 'About Us | Soft Steps Carpets & Rugs'
  },

  {
    path: 'about-us',
    redirectTo: 'about',
    pathMatch: 'full'
  },

  {
    path: 'contact',
    component: ContactPage,
    title: 'Contact Us | Soft Steps Carpets & Rugs'
  },

  {
    path: 'contact-us',
    redirectTo: 'contact',
    pathMatch: 'full'
  },

  {
    path: 'enquiries',
    component: EnquiryForm,
    title: 'Project Enquiry | Soft Steps Carpets & Rugs'
  },

  {
    path: 'custom-requirement',
    component: CustomRequirementPage,
    title: 'Custom & Project Requirements | Soft Steps'
  },

  {
    path: 'privacy-policy',
    component: PrivacyPolicyPage,
    title: 'Privacy Policy | Soft Steps Carpets & Rugs'
  },

  {
    path: 'terms',
    component: TermsPage,
    title: 'Terms & Conditions | Soft Steps Carpets & Rugs'
  },

  {
    path: '**',
    redirectTo: ''
  }

];
