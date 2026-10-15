import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin-guard';
import { AboutPage } from './features/about/about-page/about-page';
import { AdminAccessDeniedPage } from './features/admin/admin-access-denied/admin-access-denied';
import { AdminLoginPage } from './features/admin/admin-login/admin-login';
import { AdminPage } from './features/admin/admin-page/admin-page';
import { MessageComposer } from './features/admin/communications/message-composer/message-composer';
import { ContactPage } from './features/contact/contact-page/contact-page';
import { CustomRequirementPage } from './features/custom-requirement/custom-requirement-page/custom-requirement-page';
import { EnquiryForm } from './features/enquiries/enquiry-form/enquiry-form';
import { HomePage } from './features/home/home-page/home-page';
import { PrivacyPolicyPage } from './features/privacy-policy/privacy-policy-page/privacy-policy-page';
import { ProductPage } from './features/products/product-page/product-page';
import { CategoryPage } from './features/categories/category-page/category-page';
import { CollectionPage } from './features/collections/collection-page/collection-page';
import { ShopPage } from './features/shop/shop-page/shop-page';
import { TermsPage } from './features/terms/terms-page/terms-page';
import { AdminLayout } from './layouts/admin/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: 'admin/login',
    component: AdminLoginPage,
    title: 'Admin Login | Soft Steps Carpets & Rugs',
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        component: AdminPage,
        canActivate: [adminGuard],
        title: 'Admin Communication Centre',
      },
      {
        path: 'communications',
        component: MessageComposer,
        canActivate: [adminGuard],
        title: 'Admin Communications',
      },
      {
        path: 'communication',
        redirectTo: 'communications',
        pathMatch: 'full',
      },
      {
        path: 'access-denied',
        component: AdminAccessDeniedPage,
        title: 'Admin Access Required',
      },
    ],
  },

  {
    path: '',
    component: HomePage,
    title: 'Soft Steps Carpets | Handcrafted Luxury Carpets from India',
  },

  {
    path: 'shop',
    component: ShopPage,
    title: 'Shop | Soft Steps Carpets & Rugs',
  },

  {
    path: 'categories',
    component: CategoryPage,
    title: 'Categories | Soft Steps Carpets & Rugs',
  },

  {
    path: 'categories/:slug',
    component: CategoryPage,
    title: 'Category | Soft Steps Carpets & Rugs',
  },

  {
    path: 'collections',
    component: CollectionPage,
    title: 'Collections | Soft Steps Carpets & Rugs',
  },

  {
    path: 'collections/:slug',
    component: CollectionPage,
    title: 'Collection | Soft Steps Carpets & Rugs',
  },

  {
    path: 'products/:slug',
    component: ProductPage,
    title: 'Product | Soft Steps Carpets & Rugs',
  },

  {
    path: 'about',
    component: AboutPage,
    title: 'About Us | Soft Steps Carpets & Rugs',
  },

  {
    path: 'about-us',
    redirectTo: 'about',
    pathMatch: 'full',
  },

  {
    path: 'contact',
    component: ContactPage,
    title: 'Contact Us | Soft Steps Carpets & Rugs',
  },

  {
    path: 'contact-us',
    redirectTo: 'contact',
    pathMatch: 'full',
  },

  {
    path: 'enquiries',
    component: EnquiryForm,
    title: 'Project Enquiry | Soft Steps Carpets & Rugs',
  },

  {
    path: 'custom-requirement',
    component: CustomRequirementPage,
    title: 'Custom & Project Requirements | Soft Steps',
  },

  {
    path: 'privacy-policy',
    component: PrivacyPolicyPage,
    title: 'Privacy Policy | Soft Steps Carpets & Rugs',
  },

  {
    path: 'terms',
    component: TermsPage,
    title: 'Terms & Conditions | Soft Steps Carpets & Rugs',
  },

  {
    path: '**',
    redirectTo: '',
  },
];
