# Soft Steps Carpet

Premium Carpet & Rug E-Commerce Platform

Soft Steps Carpet is a modern, premium e-commerce platform designed for selling carpets, rugs, and related home furnishing products online.

The application is being developed as a single Angular-based codebase that can run across:

- Web
- PWA
- Android
- iOS

The goal is to maintain one frontend codebase while providing a premium web experience and native mobile capabilities without maintaining separate Android and iOS applications.

---

## Project Repository

GitHub:

https://github.com/surakshawalls-rgb/softsteps

---

# 1. Application Overview

Soft Steps Carpet will provide a complete digital storefront for customers to:

- Browse carpets and rugs
- Explore categories and collections
- Search products
- View detailed product information
- Select product variants and sizes
- Add products to cart
- Manage wishlist
- Checkout
- Manage delivery addresses
- Make payments
- Track orders
- Submit enquiries
- Submit wholesale enquiries
- Manage customer profiles
- Receive notifications
- Review purchased products

The platform will also include an administrative system for managing products, inventory, orders, customers, enquiries, and other business operations.

---

# 2. Main Application Areas

## Customer Storefront

The public storefront will contain:

- Home
- Shop
- Categories
- Collections
- Product Details
- Search
- Wishlist
- Cart
- Checkout
- Order Tracking
- Customer Account
- Enquiries
- Wholesale Enquiries

---

## Customer Account

Customers will be able to:

- Register
- Login
- Manage profile
- Manage addresses
- View orders
- View order details
- Track orders
- Manage wishlist
- Manage cart
- Submit enquiries
- Review eligible products

---

## Product Management

Products will support:

- Product name
- Product code / SKU
- Description
- Category
- Collection
- Images
- Product variants
- Sizes
- Materials
- Construction information
- Pricing
- Inventory
- Availability
- Product attributes
- SEO information

---

## Shopping Cart

The cart will support:

- Guest cart
- Logged-in customer cart
- Quantity management
- Product variants
- Size selection
- Cart persistence
- Cart merge after login
- Price calculation
- Order summary

---

## Wishlist

Customers will be able to:

- Add products to wishlist
- Remove products
- Move products to cart
- Maintain wishlist across sessions when logged in

---

## Checkout

Checkout will support:

- Customer information
- Delivery address
- Order summary
- Shipping information
- Payment selection
- Order creation
- Payment verification
- Order confirmation

---

## Orders

Customers will be able to:

- View orders
- View order details
- View order status
- Track shipment
- View payment status
- View purchased products
- Access order history

---

## Enquiries

The platform will support:

- General enquiries
- Product enquiries
- Wholesale enquiries
- Bulk order enquiries
- Business/customer communication

---

# 3. Technology Stack

## Frontend

### Angular

The application uses modern Angular with:

- Standalone components
- Angular Signals where appropriate
- Reactive Forms
- Lazy loading
- Routing
- Server-Side Rendering
- Hydration
- Feature-based architecture

---

## UI & Styling

### Tailwind CSS

Tailwind CSS is the primary styling system.

A custom Soft Steps design system will be built on top of Tailwind to maintain:

- Premium visual identity
- Consistent spacing
- Typography
- Colors
- Buttons
- Forms
- Cards
- Responsive layouts
- Product presentation

Ionic UI components are NOT used as the primary visual design system.

---

## Animation

### GSAP

GSAP will be used for premium interactions such as:

- Hero animations
- Product transitions
- Scroll-based animations
- Image transitions
- Page transitions
- Micro-interactions

Animations will remain subtle and performance-conscious.

Simple transitions will use CSS.

---

## Angular CDK

Angular CDK will be used where appropriate for:

- Dialogs
- Overlays
- Menus
- Accessibility
- Drag and drop
- Advanced UI interactions

---

# 4. Mobile Application Technology

## Ionic + Capacitor

The project uses Ionic and Capacitor to provide native mobile capabilities while maintaining the same Angular application.

Capacitor will be used for:

- Push notifications
- Camera
- Image upload
- Native sharing
- Deep links
- Device information
- Application lifecycle
- Local storage
- Native device APIs
- Android packaging
- iOS packaging

The goal is:

> One Angular codebase → Web + PWA + Android + iOS

Separate Android and iOS application codebases will not be maintained.

---

# 5. Backend Architecture

## Supabase

Supabase will be the primary backend platform.

Planned Supabase services include:

- PostgreSQL Database
- Authentication
- Storage
- Realtime
- Row Level Security
- Edge Functions

The application will not initially use a separate Spring Boot backend.

---

## Database

The PostgreSQL database will contain the core business data, including areas such as:

- Users / Profiles
- Categories
- Collections
- Products
- Product Images
- Product Variants
- Inventory
- Wishlists
- Carts
- Cart Items
- Addresses
- Orders
- Order Items
- Payments
- Enquiries
- Notifications
- Reviews
- Coupons
- Shipping

The final database structure and relationships will be defined before implementing the production data models.

---

# 6. Security

Security will be enforced at the backend/database level.

The application will use:

- Supabase Row Level Security
- Authentication
- Role-based access
- Protected routes
- Secure server-side operations
- Edge Functions for sensitive operations

Private credentials must never be exposed in the browser.

The Supabase service-role key, payment secrets, private API keys, and other sensitive credentials must never be committed to GitHub.

---

# 7. Data & Caching Architecture

The application follows the principle:

> CACHE → RENDER → REFRESH → UPDATE

The planned caching architecture is:

```text
Browser Cache
      ↓
Service Worker / PWA Cache
      ↓
TanStack Query Cache
      ↓
SSR / Transfer Cache
      ↓
Supabase
