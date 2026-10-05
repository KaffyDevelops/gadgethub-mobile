export interface Product {
  id: string; category_id: string | null; name: string; slug: string;
  description: string | null; short_description: string | null;
  price: number; compare_at_price: number | null; image_url: string | null;
  stock_quantity: number; is_featured: boolean; is_active: boolean; rating: number | null;
}
export interface CartItem { id: string; cart_id: string; product_id: string; quantity: number; product: Product | null; }
