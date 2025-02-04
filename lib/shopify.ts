export type ShopifyProduct = {
    id: string;
    title: string;
    image: string;
    price: string;
    variants: { node: { price: string } }[]; // ✅ Fix: Define `variants` properly
    featuredImage?: { url: string } | null; // ✅ Fix: Properly define `featuredImage`
  };
  
  
  
  
  
  export async function getProducts(): Promise<ShopifyProduct[]> {
    console.log("Fetching products from Shopify API...");
  
    try {
        const response = await fetch(
            `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`,
            {
                method: "POST",
                headers: {
                    "X-Shopify-Access-Token": process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_API_KEY || "",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    query: `
                        {
                            products(first: 5) {
                                edges {
                                    node {
                                        id
                                        title
                                        featuredImage {
                                            url
                                        }
                                        variants(first: 1) {
                                            edges {
                                                node {
                                                    price
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    `
                })
            }
        );
  
        if (!response.ok) {
            console.error("❌ Shopify API Error:", response.statusText);
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
  
        const data = await response.json();
        return data.data.products.edges.map(({ node }: { node: ShopifyProduct }) => ({
            id: node.id,
            title: node.title,
            image: node.featuredImage?.url || "/fallback.jpg",
            price: node.variants?.[0]?.node?.price || "0.00", // ✅ Fix: Properly extract variant price
            variants: node.variants || [] // ✅ Fix: Prevent TypeScript errors
        }));
    } catch (error) {
        console.error("❌ Error fetching Shopify products:", error);
        return [];
    }
}