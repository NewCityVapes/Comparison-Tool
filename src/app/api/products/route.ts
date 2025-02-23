import { NextResponse } from "next/server";
import { getProducts } from "../../../../lib/shopify"

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const vendor = url.searchParams.get("vendor");

        console.log("🔥 Requested vendor:", vendor || "All vendors");

        const products = await getProducts();

        console.log("🔥 Shopify Vendors in API Response:", products.map((p) => `"${p.vendor}"`));

        // ✅ Allow partial vendor matches (e.g., "VICE BOOST" matches "VICE BOOST 9K")
        const filteredProducts = vendor
            ? products.filter((product) =>
                  product.vendor.toLowerCase().includes(vendor.toLowerCase())
              )
            : products;

        console.log("🔥 Matching products after filtering:", filteredProducts.length);

        return NextResponse.json({ products: filteredProducts }, { status: 200 });
    } catch (error) {
        console.error("❌ Error fetching products:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}