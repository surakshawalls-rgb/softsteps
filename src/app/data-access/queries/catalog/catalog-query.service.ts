import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../supabase/supabase-client.service';
import { Product } from '../../../shared/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogQueryService {

  private readonly supabase = inject(SupabaseClientService).client;


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

    return data;
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
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
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
      .eq('status', 'active')
      .eq('category.slug', slug)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
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
      .eq('status', 'active')
      .eq('collection_id', collection.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(product => ({ ...product, collection }));
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

    return data;
  }

}
