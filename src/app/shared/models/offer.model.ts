export type OfferType = 'festive' | 'big_billion' | 'discount' | 'custom';
export type DiscountType = 'percent' | 'flat';

/** One row of the product_offers table. */
export interface ProductOffer {
  id: string;
  name: string;
  offer_type: OfferType;
  discount_type: DiscountType;
  discount_value: number;
  /** Product codes the offer applies to, e.g. ['SS_1001', 'SS_1002']. */
  product_codes: string[];
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at?: string;
}

/** What a product carries after an offer has been applied to its prices. */
export interface AppliedOffer {
  id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  /** How much cheaper the product now is, in percent (also filled for flat offers). */
  percentOff: number;
  endsAt: string | null;
}