/** One line in the cart. A line is identified by product code + size. */
export interface CartItem {
  /** `${productCode}|${size}` – the same rug in a different size is a separate line. */
  id: string;
  productCode: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  unitPrice: number;
  currency: string;
  quantity: number;
}

export type NewCartItem = Omit<CartItem, 'id' | 'quantity'>;