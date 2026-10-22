import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import {
  CatalogFilterState,
  DEFAULT_CATALOG_FILTER
} from '../models/catalog-filter.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogFilterService {

  getPrice(product: Product): number | null {
    const variants = product.variants ?? [];

    const activeVariants = variants.filter(
      variant => variant.is_active !== false
    );

    const prices = activeVariants
      .map(variant => variant.sale_price ?? variant.price)
      .filter((price): price is number => typeof price === 'number');

    return prices.length
      ? Math.min(...prices)
      : typeof product.base_price === 'number'
        ? product.base_price
        : null;
  }

  filterAndSort(
    products: Product[],
    filters: CatalogFilterState
  ): Product[] {

    const search = filters.search.trim().toLowerCase();

    let result = products.filter(product => {

      if (search) {
        const searchableText = [
          product.name,
          product.slug,
          product.description,
          product.short_description,
          product.category?.name,
          product.collection?.name,
          product.material?.name,
          product.style,
          product.primary_color,
          product.construction,
          ...(product.tags ?? [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      if (
        filters.category &&
        product.category?.slug !== filters.category
      ) {
        return false;
      }

      
    if (filters.material) {
      const productWithMaterialId = product as Product & {
        material_id?: string | null;
      };

      const productMaterialId =
        product.material?.id ?? productWithMaterialId.material_id;

      if (productMaterialId !== filters.material) {
        return false;
      }
    }


      const price = this.getPrice(product);

      if (
        filters.minPrice !== null &&
        (price === null || price < filters.minPrice)
      ) {
        return false;
      }

      if (
        filters.maxPrice !== null &&
        (price === null || price > filters.maxPrice)
      ) {
        return false;
      }

      return true;
    });

    result = [...result];

    switch (filters.sort) {

      case 'newest':
        result.sort((a, b) => {
          const aDate = a.created_at
            ? new Date(a.created_at).getTime()
            : 0;

          const bDate = b.created_at
            ? new Date(b.created_at).getTime()
            : 0;

          return bDate - aDate;
        });
        break;

      case 'price-low':
        result.sort(
          (a, b) => this.comparePrices(this.getPrice(a), this.getPrice(b))
        );
        break;

      case 'price-high':
        result.sort(
          (a, b) => this.comparePrices(this.getPrice(a), this.getPrice(b), true)
        );
        break;

      case 'name-az':
        result.sort(
          (a, b) =>
            (a.name ?? '').localeCompare(
              b.name ?? '',
              undefined,
              { sensitivity: 'base' }
            )
        );
        break;

      case 'featured':
      default:
        result.sort((a, b) => {
          const featuredDifference =
            Number(Boolean(b.featured)) -
            Number(Boolean(a.featured));

          if (featuredDifference !== 0) {
            return featuredDifference;
          }

          return (
            (a.name ?? '').localeCompare(
              b.name ?? '',
              undefined,
              { sensitivity: 'base' }
            )
          );
        });

        break;
    }

    return result;
  }

  getCategories(products: Product[]) {
    const map = new Map<string, { name: string; slug: string }>();

    products.forEach(product => {
      const category = product.category;

      if (category?.slug && category?.name) {
        map.set(category.slug, {
          name: category.name,
          slug: category.slug
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  getMaterials(products: Product[]) {
    const map = new Map<string, { name: string; slug: string }>();

    products.forEach(product => {
      const material = product.material;

      if (material?.slug && material?.name) {
        map.set(material.slug, {
          name: material.name,
          slug: material.slug
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  getPriceRange(products: Product[]) {
    const prices = products
      .map(product => this.getPrice(product))
      .filter((price): price is number => price !== null && price > 0);

    if (!prices.length) {
      return {
        min: 0,
        max: 0
      };
    }

    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  reset(): CatalogFilterState {
    return { ...DEFAULT_CATALOG_FILTER };
  }

  private comparePrices(a: number | null, b: number | null, descending = false): number {
    if (a === null) return 1;
    if (b === null) return -1;
    return descending ? b - a : a - b;
  }
}
