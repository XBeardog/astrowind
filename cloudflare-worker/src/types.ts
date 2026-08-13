export type Product = {
  id?: number;
  image_url: string;
  product_name: string;
  product_description?: string;
  product_parameters?: string;
  product_tags?: string;
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
  is_active?: number;
};

export type ProductForm = {
  id?: number;
  image_url: string;
  product_name: string;
  product_description?: string;
  product_parameters?: Record<string, string>;
  product_tags?: string[];
  sort_order?: number;
  is_active?: boolean;
};
