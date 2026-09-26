import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '../../supabase/supabase-client.service';

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

  async getProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        collection:collections(*),
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


  async getFeaturedProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        collection:collections(*),
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


  async getProductsByCategorySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(*),
        collection:collections(*),
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


  async getProductsByCollectionSlug(slug: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        collection:collections!inner(*),
        material:materials(*),
        variants:product_variants(*),
        images:product_images(*)
      `)
      .eq('status', 'active')
      .eq('collection.slug', slug)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }


  async getProductBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        collection:collections(*),
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
