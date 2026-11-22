import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { ProductImageUrlService } from '../../supabase/product-image-url.service';
import { Product } from '../../../shared/models/product.model';
import { OfferService } from '../../../core/services/offer.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogQueryService {

  private readonly supabase = inject(SupabaseClientService).client;
  private readonly productImageUrls = inject(ProductImageUrlService);
  private readonly offers = inject(OfferService);


  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }


  async getCategoryBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  // ----------------------------------------------------------
  // COLLECTIONS
  // ----------------------------------------------------------

  async getCollections() {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }


  async getCollectionBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }


  // ----------------------------------------------------------
  // MATERIALS
  // ----------------------------------------------------------

  async getMaterials() {
    const { data, error } = await this.supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  }


  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------

  async getProducts(): Promise<Product[]> {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          material:materials(*),
          supplier:suppliers(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.offers.applyTo(this.normalizeProducts(data as Product[] | null));
    }


    async getFeaturedProducts(): Promise<Product[]> {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          material:materials(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('featured', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.offers.applyTo(this.normalizeProducts(data as Product[] | null));
    }


  async getProductsByCategorySlug(slug: string): Promise<Product[]> {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories!inner(*),
          material:materials(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('category.slug', slug)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.offers.applyTo(this.normalizeProducts(data as Product[] | null));
    }


  async getProductsByCollectionSlug(slug: string): Promise<Product[]> {
      const collection = await this.getCollectionBySlug(slug);
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          material:materials(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('collection_id', collection.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const withOffers = await this.offers.applyTo(this.normalizeProducts(data as Product[] | null));

      return withOffers.map(product => ({ ...product, collection }));
    }


  async getProductBySlug(slug: string): Promise<Product> {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          material:materials(*),
          supplier:suppliers(*),
          variants:product_variants(*),
          images:product_images(*)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) {
        throw error;
      }

      const [product] = await this.offers.applyTo([this.normalizeProduct(data as Product)]);

      return product;
    }

  private normalizeProducts(products: Product[] | null): Product[] {
    return (products ?? []).map(product => this.normalizeProduct(product));
  }

  private normalizeProduct(product: Product): Product {
    return {
      ...product,
      images: product.images?.map(image => ({
        ...image,
        image_url: this.productImageUrls.publicUrl(image.image_url) ?? undefined,
      })),
    };
  }

}