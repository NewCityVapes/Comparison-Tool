import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();


const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_KEY;

export type ShopifyProduct = {
    id: string;
    title: string;
    image: string;
    price: string;
    variants: { node: { price: string } }[]; // ✅ Fix: Define `variants` properly
    featuredImage?: { url: string } | null; // ✅ Fix: Properly define `featuredImage`
  };

  interface ShopifyResponse {
    data: {
        products: {
            edges: Array<{
                node: {
                    vendor: string;
                };
            }>;
        };
    };
}
  


export async function fetchVendors(): Promise<string[]> {
    if (!SHOPIFY_API_URL || !SHOPIFY_ACCESS_TOKEN) {
        throw new Error("🚨 Missing Shopify API credentials. Check your environment variables.");
    }

    console.log("Fetching vendors from:", SHOPIFY_API_URL);

    const response = await fetch(SHOPIFY_API_URL, {
        method: "POST", // ✅ Shopify GraphQL API requires POST
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN // ✅ Correct authentication header
        },
        body: JSON.stringify({
            query: `
                {
                    products(first: 10) {
                        edges {
                            node {
                                vendor
                            }
                        }
                    }
                }
            `
        })
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
        const errorMessage = await response.text();
        console.error("❌ Shopify API Error:", errorMessage);
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result: ShopifyResponse = await response.json();
    console.log("API Response:", result); // ✅ Debugging log

    if (!result.data || !result.data.products) {
        throw new Error("Invalid API response structure");
    }

    return [...new Set(result.data.products.edges.map((product) => product.node.vendor))];
}
  
  
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