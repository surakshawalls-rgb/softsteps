import { AppliedOffer, DiscountType, ProductOffer } from '../models/offer.model';
import { Product, ProductVariant } from '../models/product.model';

/** "SS_1001", "ss 1001" and "SS1001" all become "SS1001". */
export function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function discountedPrice(price: number, type: DiscountType, value: number): number {
  const next = type === 'percent' ? price * (1 - value / 100) : price - value;

  return Math.max(Math.round(next), 1);
}

export function isOfferLive(offer: ProductOffer, now: Date = new Date()): boolean {
  if (!offer.is_active) {
    return false;
  }

  if (new Date(offer.starts_at).getTime() > now.getTime()) {
    return false;
  }

  return !offer.ends_at || new Date(offer.ends_at).getTime() > now.getTime();
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }

  return null;
}

/** The price a customer pays today for the first / only size (same idea as the product card). */
export function sellingPrice(product: Product): number | null {
  const variant = (product.variants ?? []).find(
    (item) => item.is_active !== false && typeof item.price === 'number',
  );

  if (variant && typeof variant.price === 'number') {
    const sale = toNumber(variant.sale_price);

    return sale !== null && sale < variant.price ? sale : variant.price;
  }

  return toNumber(product.base_price) ?? toNumber(product.specifications?.size_3x5_price);
}

/** Of several offers on one product, the one giving the lowest price wins. */
export function pickBestOffer(product: Product, offers: ProductOffer[]): ProductOffer | null {
  const reference = sellingPrice(product);

  if (offers.length === 0) {
    return null;
  }

  if (reference === null) {
    return offers[0];
  }

  return offers.reduce((best, offer) =>
    discountedPrice(reference, offer.discount_type, offer.discount_value) <
    discountedPrice(reference, best.discount_type, best.discount_value)
      ? offer
      : best,
  );
}

/** Returns a copy of the product with the best live offer applied to every price it has. */
export function applyOffersToProduct(product: Product, offers: ProductOffer[]): Product {
  const code = normalizeCode(product.product_code);

  if (!code) {
    return product;
  }

  const matching = offers.filter((offer) =>
    offer.product_codes.some((item) => normalizeCode(item) === code),
  );
  const offer = pickBestOffer(product, matching);

  if (!offer) {
    return product;
  }

  const cut = (price: number): number => discountedPrice(price, offer.discount_type, offer.discount_value);
  const reference = sellingPrice(product);
  const next: Product = { ...product };

  // 1) base price (shown struck-through next to the new price)
  const base = toNumber(product.base_price);
  const sizePrice = toNumber(product.specifications?.size_3x5_price);

  if (base !== null) {
    next.base_price = cut(base);
    next.compare_at_price = Math.max(toNumber(product.compare_at_price) ?? base, base);
  } else if (sizePrice !== null) {
    next.base_price = cut(sizePrice);
    next.compare_at_price = sizePrice;
  }

  // 2) variants (sizes with their own price)
  if (product.variants?.length) {
    next.variants = product.variants.map((variant): ProductVariant => {
      if (typeof variant.price !== 'number') {
        return variant;
      }

      const sale = toNumber(variant.sale_price);
      const selling = sale !== null && sale < variant.price ? sale : variant.price;

      return { ...variant, sale_price: cut(selling) };
    });
  }

  // 3) size list kept inside the specifications
  const sizes = product.specifications?.['sizes'];

  if (Array.isArray(sizes)) {
    next.specifications = {
      ...product.specifications,
      sizes: sizes.map((entry: unknown) => {
        const row = (entry ?? {}) as Record<string, unknown>;
        const price = toNumber(row['price']);

        if (price === null) {
          return entry;
        }

        const sale = toNumber(row['sale_price']);
        const selling = sale !== null && sale < price ? sale : price;

        return { ...row, sale_price: cut(selling) };
      }),
    };
  }

  const after = reference === null ? null : cut(reference);
  const percentOff =
    reference !== null && after !== null && reference > 0
      ? Math.max(Math.round((1 - after / reference) * 100), 1)
      : offer.discount_type === 'percent'
        ? Math.round(offer.discount_value)
        : 0;

  const applied: AppliedOffer = {
    id: offer.id,
    name: offer.name,
    discountType: offer.discount_type,
    discountValue: offer.discount_value,
    percentOff,
    endsAt: offer.ends_at,
  };

  next.offer = applied;

  return next;
}

/**
 * Turns what an admin types into product codes.
 * Accepts commas, spaces and new lines, and ranges such as  SS_1001-SS_1010  or  SS_1001-1010.
 */
export function parseCodeList(text: string): string[] {
  const out: string[] = [];
  const tokens = text
    .toUpperCase()
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const range = token.split(/-|–|—|\.\.|TO/).filter(Boolean);

    if (range.length === 2 && /\d$/.test(range[0]) && /\d$/.test(range[1])) {
      const startMatch = range[0].match(/^(.*?)(\d+)$/);
      const endMatch = range[1].match(/(\d+)$/);

      if (startMatch && endMatch) {
        const prefix = startMatch[1];
        const width = startMatch[2].length;
        const start = Number(startMatch[2]);
        const end = Number(endMatch[1]);

        if (end >= start && end - start <= 500) {
          for (let value = start; value <= end; value++) {
            out.push(`${prefix}${String(value).padStart(width, '0')}`);
          }

          continue;
        }
      }
    }

    out.push(token);
  }

  return out;
}