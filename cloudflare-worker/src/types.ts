// ============================================================
// 产品
// ============================================================
export type Product = {
  id?: number;
  category_id?: number | null;
  image_url: string;
  product_name: string;
  product_description?: string;
  product_parameters?: string;        // DB 存储的 JSON 字符串
  product_tags?: string;              // DB 存储的 JSON 字符串
  created_at?: string;
  updated_at?: string;
  sort_order?: number;
  is_active?: number;
  carousel_fixed?: number;            // 1=固定出现在产品实拍轮播
};

export type ProductForm = {
  id?: number;
  category_id?: number | null;
  image_url: string;
  product_name: string;
  product_description?: string;
  product_parameters?: Record<string, string>;  // 前端传来的对象
  product_tags?: string[];                       // 前端传来的数组
  sort_order?: number;
  is_active?: boolean;
  carousel_fixed?: boolean;
};

// ============================================================
// 产品分类
// ============================================================
export type Category = {
  id?: number;
  name: string;
  name_en?: string;
  slug?: string;
  sort_order?: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
};

export type CategoryForm = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'is_active'> & {
  is_active?: boolean;
};

// ============================================================
// 工厂实拍（朋友圈式动态）
// ============================================================
export type Moment = {
  id?: number;
  content?: string;
  images?: string;                   // DB 存储的 JSON 数组字符串
  is_active?: number;
  created_at?: string;
  updated_at?: string;
};

export type MomentForm = {
  content?: string;
  images?: string[];                 // 前端传来的图片地址数组
  is_active?: boolean;
};

// ============================================================
// 询盘
// ============================================================
export type Inquiry = {
  id?: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  product_id?: number | null;
  message?: string;
  status?: string;                   // 'new' | 'replied' | 'closed'
  created_at?: string;
  replied_at?: string;
  reply_note?: string;
};

export type InquiryForm = Pick<Inquiry, 'name' | 'company' | 'email' | 'phone' | 'country' | 'product_id' | 'message'>;

export type InquiryReplyForm = {
  status?: string;
  reply_note?: string;
};
