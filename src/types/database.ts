import type { OrderNotesStructured } from "./api";

export type StockLocation = "nacional" | "internacional" | "ambos";
export type ShippingType = "nacional" | "internacional";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  variant: string | null;
  quantity: number;
  price: number;
  image: string;
}

export interface ProductReviewInsert {
  product_id: string;
  order_id?: string | null;
  reviewer_name?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  variant?: string | null;
  is_verified_purchase?: boolean;
  is_approved?: boolean;
}

export interface CategoryInsert {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface ProductInsert {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category_id: string;
  images: string[];
  video_url?: string | null;
  variants: ProductVariant[];
  stock_location: StockLocation;
  free_shipping?: boolean;
  shipping_cost?: number | null;
  provider_api_url?: string | null;
  is_featured?: boolean;
  is_active?: boolean;
  is_bestseller?: boolean | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface OrderInsert {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_document: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  shipping_zip?: string | null;
  status?: OrderStatus;
  payment_id?: string | null;
  payment_method?: string | null;
  shipping_type: ShippingType;
  subtotal: number;
  shipping_cost: number;
  total: number;
  items: OrderItem[];
  notes?: string | OrderNotesStructured | null;
}

export interface FulfillmentLogInsert {
  order_id: string;
  action: string;
  payload?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  status: string;
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          icon: string | null;
          color: string | null;
          created_at: string;
        };
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          compare_at_price: number | null;
          category_id: string;
          images: string[];
          video_url?: string | null;
          variants: ProductVariant[];
          stock_location: StockLocation;
          free_shipping?: boolean | null;
          shipping_cost?: number | null;
          provider_api_url: string | null;
          is_featured: boolean;
          is_active: boolean;
          is_bestseller: boolean | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          order_id: string | null;
          reviewer_name: string | null;
          rating: number;
          title: string | null;
          body: string;
          variant: string | null;
          is_verified_purchase: boolean;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: ProductReviewInsert;
        Update: Partial<ProductReviewInsert>;
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          customer_document: string;
          shipping_address: string;
          shipping_city: string;
          shipping_department: string;
          shipping_zip: string | null;
          status: OrderStatus;
          payment_id: string | null;
          payment_method: string | null;
          shipping_type: ShippingType;
          subtotal: number;
          shipping_cost: number;
          total: number;
          items: OrderItem[];
          notes: string | OrderNotesStructured | null;
          created_at: string;
          updated_at: string;
        };
        Insert: OrderInsert;
        Update: Partial<OrderInsert>;
        Relationships: [];
      };
      fulfillment_logs: {
        Row: {
          id: string;
          order_id: string;
          action: string;
          payload: Record<string, unknown> | null;
          response: Record<string, unknown> | null;
          status: string;
          created_at: string;
        };
        Insert: FulfillmentLogInsert;
        Update: Partial<FulfillmentLogInsert>;
        Relationships: [
          {
            foreignKeyName: "fulfillment_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      blocked_ips: {
        Row: {
          ip: string;
          duration: string | null;
          reason: string | null;
          blocked_at: string;
          expires_at: string | null;
        };
        Insert: {
          ip: string;
          duration?: string | null;
          reason?: string | null;
          blocked_at?: string;
          expires_at?: string | null;
        };
        Update: {
          ip?: string;
          duration?: string | null;
          reason?: string | null;
          blocked_at?: string;
          expires_at?: string | null;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          count: number;
          reset_at: string;
        };
        Insert: {
          key: string;
          count?: number;
          reset_at: string;
        };
        Update: {
          key?: string;
          count?: number;
          reset_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  reviews_count?: number;
  average_rating?: number;
};
export type ProductReview =
  Database["public"]["Tables"]["product_reviews"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
