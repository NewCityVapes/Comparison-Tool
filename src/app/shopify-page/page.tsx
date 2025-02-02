"use client";
import { useEffect, useState } from "react";
import { getProducts, ShopifyProduct } from "../../../lib/shopify";
import Image from "next/image";

export default function ShopifyPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

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
//API Token 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
