import Image from "next/image";
import { getProducts, ShopifyProduct } from "../../../lib/shopify";

export default async function ShopifyPage() {
  const products: ShopifyProduct[] = await getProducts(); // ✅ Server-Side Fetching

  return (
    <div>
      <h1>Shopify Products</h1>
      <ul>
        {products.length > 0 ? (
          products.map((product: ShopifyProduct) => (
            <li key={product.id}>
              <h2>{product.title}</h2>
              <Image
                src={product.image}
                alt={product.title}
                width={200}
                height={200}
                unoptimized // 🚀 Optional: Removes Next.js optimization if images fail to load
              />
              <p>Price: ${product.price}</p>
            </li>
          ))
        ) : (
          <p>Loading products...</p>
        )}
      </ul>
    </div>
  );
}
