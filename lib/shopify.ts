
const SHOPIFY_API_URL = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-10/graphql.json`;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_KEY;

export type ShopifyProduct = {
    id: string;
    title: string;
    vendor: string;
    image: string;
    price: string;
    variants: { price: string }[]; // ✅ Ensure this matches your final mapped structure
};


export type ShopifyAPIResponse = {
    data: {
        products: {
            edges: {
                node: {
                    id: string;
                    title: string;
                    vendor: string;
                    featuredImage?: { url: string } | null;
                    variants: {
                        edges: { node: { price: string } }[];
                    };
                };
            }[];
        };
    };
};

  interface ShopifyResponse {
    data: {
        products: {
            edges: Array<{
                node: {
                    vendor: string;
                    productType: string;
                };
            }>;
            pageInfo: { // ✅ Add pageInfo to match GraphQL response
                hasNextPage: boolean;
                endCursor: string;
            };
        };
    };
}
  

export async function fetchVendors(): Promise<string[]> {
    if (!SHOPIFY_API_URL || !SHOPIFY_ACCESS_TOKEN) {
        throw new Error("🚨 Missing Shopify API credentials. Check your environment variables.");
    }

    console.log("Fetching all vendors from:", SHOPIFY_API_URL);

    const vendors: string[] = []; // ✅ Change `let` to `const`
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
        const response = await fetch(SHOPIFY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN
            },
            body: JSON.stringify({
                query: `
                    {
                        products(first: 50, after: ${endCursor ? `"${endCursor}"` : "null"}) {
                            edges {
                                node {
                                    vendor
                                    productType
                                }
                            }
                            pageInfo {
                                hasNextPage
                                endCursor
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
        console.log("API Response:", result);

        if (!result.data || !result.data.products) {
            throw new Error("Invalid API response structure");
        }

        // ✅ Extract vendors only if productType is "DISPOSABLES"
        const newVendors = result.data.products.edges
            .filter((product) => product.node.productType === "DISPOSABLES")
            .map((product) => product.node.vendor);

        vendors.push(...newVendors); // ✅ This is allowed because we're modifying the array content, not reassigning `vendors`

        // ✅ Get next page information
        hasNextPage = result.data.products.pageInfo.hasNextPage;
        endCursor = result.data.products.pageInfo.endCursor;
    }

    return [...new Set(vendors)].sort((a, b) => a.localeCompare(b));
}
  


let cachedProducts: ShopifyProduct[] = []; // ✅ Explicitly set type

export async function getProducts(): Promise<ShopifyProduct[]> {
    if (cachedProducts.length > 0) {  // ✅ Return cached data instantly
        console.log("⚡ Using Cached Products");
        return cachedProducts;
    }

    console.log("🚀 Fetching all products from Shopify API...");

    let allProducts: ShopifyProduct[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    try {
        while (hasNextPage) {
            const query: string = `
                {
                    products(first: 50, after: ${endCursor ? `"${endCursor}"` : "null"}) {
                        edges {
                            node {
                                id
                                title
                                vendor
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
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                    }
                }
            `;

            const response = await fetch(SHOPIFY_API_URL, {
                method: "POST",
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN || "",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                console.error("❌ Shopify API Error:", response.statusText);
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.data || !data.data.products) {
                console.error("❌ Shopify API did not return products.");
                throw new Error("Shopify API response is missing 'products'.");
            }

            const products = (data as ShopifyAPIResponse).data.products.edges.map(({ node }) => ({
                id: node.id,
                title: node.title,
                vendor: node.vendor.trim(),
                image: node.featuredImage?.url || "/fallback.jpg",
                price: node.variants?.edges?.[0]?.node?.price || "0.00",
                variants: node.variants?.edges.map((v) => ({ price: v.node.price })) || []
            }));

            allProducts = [...allProducts, ...products]; // ✅ Append new batch to allProducts

            hasNextPage = data.data.products.pageInfo.hasNextPage;
            endCursor = data.data.products.pageInfo.endCursor;
        }

        cachedProducts = allProducts; // ✅ Cache all fetched products
        console.log("🔥 Total Products Cached:", cachedProducts.length);
        return cachedProducts;
    } catch (error) {
        console.error("❌ Error fetching Shopify products:", error);
        return [];
    }
}