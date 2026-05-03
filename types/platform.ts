import type { DeliveryPaymentSettings } from "@/types/admin";
import type { Coupon } from "@/types/admin";
import type { MockOrder } from "@/types/cart";
import type { CustomerAccount } from "@/types/customer";
import type {
  BenefitItem,
  CategoryPreview,
  DeliveryInfoItem,
  HomepageSection,
  ProductAttributeDefinition,
  ProductReview,
  ProductPreview,
  ReviewItem,
  SiteSettings,
  Supplier,
} from "@/types/store";

export type StorefrontConfig = {
  settings: SiteSettings;
  categories: CategoryPreview[];
  products: ProductPreview[];
  suppliers: Supplier[];
  productReviews: ProductReview[];
  attributeDefinitions: ProductAttributeDefinition[];
  homepageSections: HomepageSection[];
  benefits: BenefitItem[];
  reviews: ReviewItem[];
  deliveryInfo: DeliveryInfoItem[];
  deliveryPayment: DeliveryPaymentSettings;
  coupons: Coupon[];
  orders: MockOrder[];
  customers: CustomerAccount[];
};

export type StorefrontConfigOverrides = Partial<
  Pick<
    StorefrontConfig,
    | "settings"
    | "categories"
    | "products"
    | "suppliers"
    | "productReviews"
    | "attributeDefinitions"
    | "homepageSections"
    | "deliveryPayment"
    | "coupons"
    | "orders"
    | "customers"
  >
>;
